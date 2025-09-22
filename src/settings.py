import json
import os

from collections import UserDict

class Settings(UserDict):
    def __getattr__(self, name):
        return self.__getitem__(name.upper())

    def __getitem__(self, name):
        return super().__getitem__(name.upper())

    def __setitem__(self, name, value):
        name = name.upper()
        super().__setitem__(name, Settings(value) if isinstance(value, dict) else value)
    
    def load(self, pathlist: list):
        for path in pathlist:
            if os.path.exists(path):
                with open(path) as f:
                    # this is a bit dangerous, we should not trust config files
                    self.update(json.load(f))

settings = Settings({
    "DB_HOST": os.getenv("DB_HOST", "localhost:8080"),
    "EVENTO_WEB_SEARCH_URL": os.getenv("EVENTO_WEB_PRINT_URL", "https://eventoweb.zhaw.ch/EVT_Pages/SuchResultat.aspx?node=c594e3e5-cd9a-4204-9a61-de1e43ccb7b0&Tabkey=WebTab_ModuleSuchenZHAW"),
    "IMPORT_INTERVAL": int(os.getenv('IMPORT_INTERVAL', 86400)), # 24h
    "BATCH_INTERVAL": int(os.getenv('BATCH_INTERVAL', 300)), # 5 min
    "BATCH_SIZE": int(os.getenv("BATCH_SIZE", 100)),
    "LOG_LEVEL": os.getenv("LOG_LEVEL", "ERROR"),
    "MQ_HOST": os.getenv("MQ_HOST", "mq"),
    "MQ_EXCHANGE": os.getenv("MQ_EXCHANGE", "zhaw-km"),
    "MQ_HEARTBEAT": int(os.getenv("MQ_HEARTBEAT", 6000)),
    "MQ_TIMEOUT": int(os.getenv("MQ_TIMEOUT", 3600)),
    "MQ_USER": os.getenv("MQ_USER", "extraction-evento"),
    "MQ_PASS": os.getenv("MQ_PASS", "guest")
})
