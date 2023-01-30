import os
import json

if os.path.exists('/etc/app/config.json'):
    with open('/etc/app/config.json') as secrets_file:
        config = json.load(secrets_file)
        params = ['target_host', 'target_path', 'db_host', 'db_path', 'log_level', 'cutoff_dates', 'request_interval']
        for key in params:
            if key in config and config[key] is not None:
                os.environ[str.upper(key)] = config[key]


TARGE_HOST = os.getenv('TARGET_HOST', 'zhaw.ch')
DB_HOST = os.getenv('DB_HOST')
CUTOFF_DATES= int(os.getenv('CUTOFF_DATES'))
LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG')
