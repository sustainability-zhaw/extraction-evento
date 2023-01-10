import datetime
import time

import logging

import settings
import hookup

logging.basicConfig(format="%(levelname)s: %(name)s: %(asctime)s: %(message)s", level=settings.LOG_LEVEL)

logger = logging.getLogger("extract-evento-loop")

while True:
    logger.info("start iteration")
    hookup.run()
    # implicit timing
    logger.info("finish iteration") 
    time.sleep(settings.BATCH_INTERVAL)
