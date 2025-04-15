def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


@singleton
class Settings:
    def __init__(self):
        self.url_post = 'http://127.0.0.1:8080/post_data'
        self.url_get = 'http://127.0.0.1:8080/get_data'
        self.request_time = 5

@singleton
class SendDataLogger:
    def __init__(self):
        pass

@singleton
class GetDataLogger:
    def __init__(self):
        pass
