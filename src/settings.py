import os

TARGE_HOST = os.getenv('AD_HOST', 'zhaw.ch')
DB_HOST = os.getenv('DB_HOST')
CUTOFF_DATES= int(os.getenv('CUTOFF_DATES'))
LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG')
