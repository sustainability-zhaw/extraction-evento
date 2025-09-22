import logging
import time

import pika

import importer
from settings import settings

settings.load([
    "/etc/app/config.json", 
    "/etc/app/secrets.json"
])

logging.basicConfig(format="%(levelname)s: %(name)s: %(asctime)s: %(message)s", level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

logging.getLogger("pika").setLevel(logging.WARNING)

if __name__ == "__main__":
    logger.info(f"init message queue connection to host '{settings.MQ_HOST}'")

    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=settings.MQ_HOST,
            heartbeat=settings.MQ_HEARTBEAT,
            blocked_connection_timeout=settings.MQ_TIMEOUT,
            credentials=pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASS)
        )
    )

    channel = connection.channel()

    while True:
        try:
            logger.info("Running import")
            importer.run(channel)
        except:
            logger.exception('Unhandled exception')

        logger.info(f"Import completed. Waiting {settings.IMPORT_INTERVAL} seconds before next import run.") 
        time.sleep(settings.IMPORT_INTERVAL)
