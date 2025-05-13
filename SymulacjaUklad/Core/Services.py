from Core.Models.SettingsModel import Settings

class AppService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def run(self):
        print(f"URL: {self.settings.serverUrl}")
        print(f"Device: {self.settings.deviceId}")
        print(f"Auth Key: {self.settings.authKey}")
        print(f"Interval: {self.settings.timeInterval} sec")
