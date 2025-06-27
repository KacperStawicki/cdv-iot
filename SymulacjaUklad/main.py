import json
import signal
import sys
from Core.Container import container
from Core.Models.SettingsModel import Settings
from Core.Services import AppService
import hashlib
from datetime import datetime
import asyncio
import websockets
import random
import logging
import os
from logging.handlers import RotatingFileHandler
import colorlog


def load_settings():
    os.makedirs("logs", exist_ok=True)

    log_formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    color_formatter = colorlog.ColoredFormatter(
        fmt="%(log_color)s%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            "DEBUG": "cyan",
            "INFO": "green",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "bold_red"
        }
    )

    logger = logging.getLogger("iot-simulator")
    logger.setLevel(logging.INFO)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(color_formatter)
    logger.addHandler(console_handler)

    file_handler = RotatingFileHandler("logs/simulator.log", maxBytes=5_000_000, backupCount=5, encoding="utf-8")
    file_handler.setFormatter(log_formatter)
    logger.addHandler(file_handler)

    with open('config.json', 'r') as f:
        config = json.load(f)

    settings = Settings(**config)

    container.register_singleton(Settings, settings)
    container.register_singleton(logging.Logger, logger)
    container.register_singleton(AppService, AppService(settings, logger))
    logger.error("Settings loaded")
    logger.info("Settings loaded successfully")


def generateSignature(deviceId, authKey, timestamp):
    to_hash = f"{deviceId}:{authKey}:{timestamp}"
    return hashlib.md5(to_hash.encode('utf-8')).hexdigest()


def get_random_moisture_level():
    return random.randint(0, 100)


class DeviceSimulator:
    def __init__(self):
        self.settings = container.resolve(Settings)
        self.logger = container.resolve(logging.Logger)
        self.authenticated = False
        self.is_claimed = False
        self.thresholdRed = 0
        self.thresholdYellow = 0
        self.thresholdGreen = 0
        self.ws = None
        self.measurement_task = None
        self.stop_event = asyncio.Event()

    async def start(self):
        self.logger.info("Starting device simulator")
        print(
            f"[DEBUG] Starting simulator with deviceId={self.settings.deviceId}, authKey={self.settings.authKey},"
            f" interval={self.settings.intervalSeconds}s")
        self.logger.info(
            f"Connecting to serverUrl=wss://{self.settings.serverUrl}/websocket?deviceId={self.settings.deviceId}")

        while not self.stop_event.is_set():
            try:
                await self.connect_and_run()
            except Exception as e:
                self.logger.error(f"{e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)

    async def connect_and_run(self):
        url = f"wss://{self.settings.serverUrl}/websocket?deviceId={self.settings.deviceId}"
        async with websockets.connect(url) as websocket:
            self.ws = websocket
            self.authenticated = False
            self.is_claimed = False
            self.logger.info("Connected to server!")

            await self.listen()
            self.logger.debug("Websocket probably closed.")

    async def listen(self):
        async for message in self.ws:
            try:
                data = json.loads(message)
                await self.handle_message(data)
            except Exception as e:
                self.logger.error(f"Failed to process message: {e}")

    async def handle_message(self, message):
        msg_type = message.get("type")
        if msg_type == "welcome":
            self.logger.info(f"[SERVER] {message.get('message')}")
            await self.authenticate()
        elif msg_type == "auth_success":
            self.authenticated = True
            self.is_claimed = message.get("claimed", False)
            self.logger.info(f"Authenticated! Claimed: {self.is_claimed}")

            await self.send_measurement()

            if self.is_claimed:
                await self.start_measurements()
            else:
                self.logger.info("Waiting for device to be claimed...")
        elif msg_type == "claimed":
            self.is_claimed = True
            self.thresholdRed = message.get("thresholdRed", 0)
            self.thresholdYellow = message.get("thresholdYellow", 0)
            self.thresholdGreen = message.get("thresholdGreen", 0)

            self.logger.info(
                f"[CONFIG] thresholds: RED {self.thresholdRed} YELLOW {self.thresholdYellow} GREEN {self.thresholdGreen}")
            await self.start_measurements()
        elif msg_type == "config":
            self.thresholdRed = message.get("thresholdRed", 0)
            self.thresholdYellow = message.get("thresholdYellow", 0)
            self.thresholdGreen = message.get("thresholdGreen", 0)
            self.logger.info(
                f"[CONFIG UPDATE] RED {self.thresholdRed} YELLOW {self.thresholdYellow} GREEN {self.thresholdGreen}")
        elif msg_type == "ack":
            pass
        elif msg_type == "error":
            self.logger.error(f"[SERVER ERROR] {message.get('message')}")
        else:
            self.logger.warning(f"[UNKNOWN] {message}")

    async def authenticate(self):
        timestamp = datetime.now().isoformat()
        signature = generateSignature(self.settings.deviceId, self.settings.authKey, timestamp)
        auth_message = {
            "type": "auth",
            "deviceId": self.settings.deviceId,
            "timestamp": timestamp,
            "signature": signature
        }
        await self.ws.send(json.dumps(auth_message))
        self.logger.debug(f"Sent authentication message → deviceId={self.settings.deviceId}, signature={signature}")

    async def start_measurements(self):
        if self.measurement_task:
            self.logger.debug("Measurement loop already running. Skipping...")
            return
        self.logger.info("Starting measurement loop...")
        self.measurement_task = asyncio.create_task(self.measurement_loop())

    async def send_measurement(self):
        level = get_random_moisture_level()
        status = self.determine_status(level)
        self.logger.info(f"[MEASUREMENT] (initial) Moisture: {level}% → {status}")

        measurement = {
            "type": "measurement",
            "deviceId": self.settings.deviceId,
            "moistureLevel": level,
            "timestamp": datetime.now().isoformat()
        }
        try:
            await self.ws.send(json.dumps(measurement))
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.error(f"WebSocket closed: {e}")
        except Exception as e:
            self.logger.error(f"Failed to send measurement: {e}")

    async def measurement_loop(self):
        while self.authenticated and not self.stop_event.is_set():
            level = get_random_moisture_level()
            status = self.determine_status(level)
            self.logger.info(f"[MEASUREMENT] Moisture: {level}% → {status}")

            measurement = {
                "type": "measurement",
                "deviceId": self.settings.deviceId,
                "moistureLevel": level,
                "timestamp": datetime.now().isoformat()
            }

            try:
                await self.ws.send(json.dumps(measurement))
            except websockets.exceptions.ConnectionClosed as e:
                self.logger.error(f"WebSocket closed: {e}")
                break
            except Exception as e:
                self.logger.error(f"Failed to send measurement: {e}")
                break

            await asyncio.sleep(self.settings.intervalSeconds)

        self.logger.debug(
            f"Measurement loop ended. authenticated={self.authenticated}, stop_event={self.stop_event.is_set()}")

    def determine_status(self, level):
        if level <= self.thresholdRed:
            return "DRY (RED)"
        elif level <= self.thresholdYellow:
            return "LOW (YELLOW)"
        elif level <= self.thresholdGreen:
            return "GOOD (GREEN)"
        else:
            return "WET (BLUE)"

    def stop(self):
        self.stop_event.set()
        if self.ws:
            asyncio.create_task(self.ws.close())


def main():
    load_settings()
    simulator = DeviceSimulator()

    def shutdown():
        simulator.logger.info("Stopping simulator...")
        simulator.stop()

    signal.signal(signal.SIGINT, lambda s, f: shutdown())
    signal.signal(signal.SIGTERM, lambda s, f: shutdown())

    asyncio.run(simulator.start())
    simulator.logger.info("Simulator stopped.")
    sys.exit(0)


if __name__ == '__main__':
    main()
