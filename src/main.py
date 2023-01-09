import datetime
import logging
import time

import settings
import hookup

logging.basicConfig(format="%(levelname)s: %(name)s: %(asctime)s: %(message)s", level=settings.LOG_LEVEL)

while True:
    hookup.run()
    time.sleep(settings.BATCH_INTERVAL)
