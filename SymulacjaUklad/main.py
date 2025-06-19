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

def load_settings():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    logger = logging.getLogger("iot-simulator")

    with open('config.json', 'r') as f:
        config = json.load(f)

    settings = Settings(**config)

    # Rejestracja zależności
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
        print(
            f"[DEBUG] Connecting to serverUrl=ws://{self.settings.serverUrl}/websocket?deviceId={self.settings.deviceId}")

        while not self.stop_event.is_set():
            try:
                await self.connect_and_run()
            except Exception as e:
                print(f"[ERROR] {e}. Reconnecting in 5 seconds...") #TODO poprawić wyświetlanie tego(wystarczy komunikat o tym że nie ma połączenia skąd i dlaczego)
                await asyncio.sleep(5)

    async def connect_and_run(self):
        url = f"ws://{self.settings.serverUrl}/websocket?deviceId={self.settings.deviceId}"
        async with websockets.connect(url) as websocket:
            self.ws = websocket
            self.authenticated = False
            self.is_claimed = False
            print("Connected to server!")

            await self.listen()
            print("[DEBUG] Websocket probably closed.")

    async def listen(self):
        async for message in self.ws:
            try:
                data = json.loads(message)
                await self.handle_message(data)
            except Exception as e:
                print(f"[ERROR] Failed to process message: {e}")

    async def handle_message(self, message):
        msg_type = message.get("type")
        if msg_type == "welcome":
            print(f"[SERVER] {message.get('message')}")
            await self.authenticate()
        elif msg_type == "auth_success":
            self.authenticated = True
            #self.is_claimed = True # Tutaj ustawić jeżeli ma wysyłać cyklicznie nieważne od servera
            self.is_claimed = message.get("claimed", False)
            print(f"Authenticated! Claimed: {self.is_claimed}")

            await self.send_measurement()

            if self.is_claimed:
                await self.start_measurements()
            else:
                print("Waiting for device to be claimed...")
        elif msg_type == "claimed":
            self.is_claimed = True
            self.thresholdRed = message.get("thresholdRed", 0)
            self.thresholdYellow = message.get("thresholdYellow", 0)
            self.thresholdGreen = message.get("thresholdGreen", 0)

            print(
                f"[CONFIG] thresholds: RED {self.thresholdRed} YELLOW {self.thresholdYellow} GREEN {self.thresholdGreen}")
            await self.start_measurements()
        elif msg_type == "config":
            self.thresholdRed = message.get("thresholdRed", 0)
            self.thresholdYellow = message.get("thresholdYellow", 0)
            self.thresholdGreen = message.get("thresholdGreen", 0)
            print(f"[CONFIG UPDATE] RED {self.thresholdRed} YELLOW {self.thresholdYellow} GREEN {self.thresholdGreen}")
        elif msg_type == "ack":
            pass
        elif msg_type == "error":
            print(f"[SERVER ERROR] {message.get('message')}")
        else:
            print(f"[UNKNOWN] {message}")

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
        print(f"Sent authentication message → deviceId={self.settings.deviceId}, signature={signature}")

    async def start_measurements(self):
        if self.measurement_task:
            print("[DEBUG] Measurement loop already running. Skipping...")
            return
        print("Starting measurement loop...")
        self.measurement_task = asyncio.create_task(self.measurement_loop())

    async def send_measurement(self):
        level = get_random_moisture_level()
        status = self.determine_status(level)
        print(f"[MEASUREMENT] (initial) Moisture: {level}% → {status}")

        measurement = {
            "type": "measurement",
            "deviceId": self.settings.deviceId,
            "moistureLevel": level,
            "timestamp": datetime.now().isoformat()
        }
        try:
            await self.ws.send(json.dumps(measurement))
        except websockets.exceptions.ConnectionClosed as e:
            print(f"[ERROR] WebSocket closed: {e}")
        except Exception as e:
            print(f"[ERROR] Failed to send measurement: {e}")

    async def measurement_loop(self):
        while self.authenticated and not self.stop_event.is_set():
            #print(f"[DEBUG] Loop condition: authenticated={self.authenticated}, stop_event={self.stop_event.is_set()}")
            #print("[DEBUG] Measurement loop is running...")

            level = get_random_moisture_level()
            status = self.determine_status(level)
            print(f"[MEASUREMENT] Moisture: {level}% → {status}")

            measurement = {
                "type": "measurement",
                "deviceId": self.settings.deviceId,
                "moistureLevel": level,
                "timestamp": datetime.now().isoformat()
            }

            try:
                await self.ws.send(json.dumps(measurement))
            except websockets.exceptions.ConnectionClosed as e:
                print(f"[ERROR] WebSocket closed: {e}")
                break
            except Exception as e:
                print(f"[ERROR] Failed to send measurement: {e}")
                break

            await asyncio.sleep(self.settings.intervalSeconds)

        print(
            f"[DEBUG] Measurement loop ended. authenticated={self.authenticated}, stop_event={self.stop_event.is_set()}")

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
        print("\n[INFO] Stopping simulator...")
        simulator.stop()

    signal.signal(signal.SIGINT, lambda s, f: shutdown())
    signal.signal(signal.SIGTERM, lambda s, f: shutdown())

    asyncio.run(simulator.start())
    print("[INFO] Simulator stopped.")
    sys.exit(0)

if __name__ == '__main__':
    main()
