import json
import logging
import math
import time

from bs4 import BeautifulSoup
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
import requests

from settings import settings


logger = logging.getLogger(__name__)

graphql_client = Client(
    transport=RequestsHTTPTransport(url=f"http://{settings.DB_HOST}/graphql"),
    fetch_schema_from_transport=True
)


def batch(list, batch_size):
    list_size = len(list)
    batch_size = batch_size if batch_size > 0 else list_size
    number_of_batches = math.ceil(list_size / batch_size) if batch_size > 0 else 0
    for batch_index, offset in enumerate(range(0, list_size, batch_size)):
        batch_number = batch_index + 1
        yield (
            list[offset:min(offset + batch_size, list_size)], 
            batch_number, 
            number_of_batches
        )


def fetch_module_urls():
    response = requests.get(settings.EVENTO_WEB_SEARCH_PRINT_URL, params={ "Print": "true" })
    response.raise_for_status()
    soup = BeautifulSoup(response.content)
    # TODO: Extract urls from content


def fetch_module(url):
    response = requests.get(url, params={ "Print": "true" })
    response.raise_for_status()
    soup = BeautifulSoup(response.content)
    # TODO: extract values from content


def build_info_object(module):
    info_object = {
        "link": module["url"],
        "category": { "name": "modules" },
        "title": module["title"],
        "departments": [{ "id": "department_" + module["department"].upper() }],
        "abstract": ""
    }
    return info_object


def upsert_info_object(info_object):
    graphql_client.execute(
        gql(
            """
            mutation ($infoObject: [AddInfoObjectInput!]!) {
                addInfoObject(input: $infoObject, upsert: true) {
                    infoObject { 
                        link
                    }
                }
            }
            """
        ),
        variable_values={
            "infoObject": [info_object]
        }
    )


def run(channel):    
    module_urls = fetch_module_urls()

    for batch_of_module_urls, batch_number, number_of_batches in batch(module_urls, settings.BATCH_SIZE):
        logger.info(f"Processing batch {batch_number} of {number_of_batches}")
        for module_url in batch_of_module_urls:
            try:
                module = fetch_module(module_url)

                info_object = build_info_object(module)
                upsert_info_object(info_object)

                channel.basic_publish(
                    exchange=settings.MQ_EXCHANGE,
                    routing_key="importer.object", 
                    body=json.dumps({ "link": info_object["link"] })
                )
            except:
                logger.exception(f"An error occured during processing of module: {module_url}")
                continue
        

        logger.info(f"Finished processing batch {batch_number} of {number_of_batches}")

        if batch_number < number_of_batches:
            logger.info(f"Waiting {settings.BATCH_INTERVAL} seconds before processing next batch")
            time.sleep(settings.BATCH_INTERVAL)
