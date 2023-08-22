import base64
import functions_framework
import os
import shutil
import logging
from sqlalchemy import create_engine

from functions.cpi_proc import download_cpi
from functions.boc_rates_proc import download_boc_rates

# Triggered from a message on a Cloud Pub/Sub topic.
@functions_framework.cloud_event
def maple_cpi_data_proc(cloud_event):
    # Print out the data from Pub/Sub, to prove that it worked
    print(base64.b64decode(cloud_event.data["message"]["data"]))

    engine = create_engine(os.getenv('POSTGRES_CONNECTION'))

    logging.info("Connected to Hydra Database")

    cpi = download_cpi()

    logging.info("Downloaded CPI data and prepared dataframe")

    cpi.to_sql('cpi', engine, schema = 'maple_cpi', if_exists = "replace", index = False)

    logging.info("Uploaded CPI to Hydra Database")

    boc_rates = download_boc_rates()

    logging.info("Downloaded BOC Rates data and prepared dataframe")

    boc_rates.to_sql('boc_rates', engine, schema = 'maple_cpi', if_exists = "replace", index = False)

    logging.info("Uploaded BoC Rates to Hydra Database")
    logging.warning("End of Process!")

