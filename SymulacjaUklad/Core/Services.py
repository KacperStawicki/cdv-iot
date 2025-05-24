from logging import Logger

from Core.Models.SettingsModel import Settings

class AppService:
    def __init__(self, settings: Settings, logger: Logger):
        self.settings = settings
        self.logger = logger

    def print_settings(self):
        print(f"URL: {self.settings.serverUrl}")
        print(f"Device: {self.settings.deviceId}")
        print(f"Auth Key: {self.settings.authKey}")
        print(f"Interval: {self.settings.intervalSeconds} sec")
