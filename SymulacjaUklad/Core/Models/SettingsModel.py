# Model ustawień
class Settings:
    def __init__(self, serverUrl: str, deviceId: str, authKey: str, intervalSeconds: int):
        self.serverUrl = serverUrl
        self.deviceId = deviceId
        self.authKey = authKey
        self.intervalSeconds = intervalSeconds
