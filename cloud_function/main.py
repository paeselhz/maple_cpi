import os
import shutil
from sqlalchemy import create_engine

from functions.cpi_proc import download_cpi
from functions.boc_rates_proc import download_boc_rates

engine = create_engine(os.getenv('POSTGRES_CONNECTION'))

cpi = download_cpi()

# cpi.to_sql('cpi', engine, schema = 'maple_cpi', if_exists = "replace", index = False)

shutil.rmtree('cpi')

boc_rates = download_boc_rates()

# boc_rates.to_sql('boc_rates', engine, if_exists = "replace", index = False)

shutil.rmtree('boc_rates')
