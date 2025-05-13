import json
from Core.Container import container
from Core.Models.SettingsModel import Settings
from Core.Services import AppService

def load_settings():
    with open('config.json', 'r') as f:
        config = json.load(f)

    settings = Settings(**config)
    container.register_singleton(Settings, settings)
    container.register_singleton(AppService, AppService(settings))

def main():
    # Wczytywanie ustawień i pokazanie ich przy starcie
    load_settings()
    service = container.resolve(AppService)
    service.run()

if __name__ == '__main__':
    main()
