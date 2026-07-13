import os
import zipfile
import logging
import requests
import pandas as pd

geographical_locations = [
    "Canada",
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
]

major_groups = [
    "All-items",
    "Food",
    "Shelter",
    "Household operations, furnishings and equipment",
    "Clothing and footwear",
    "Transportation",
    "Health and personal care",
    "Recreation, education and reading",
    "Alcoholic beverages, tobacco products and recreational cannabis",
]

cpi_url = "https://www150.statcan.gc.ca/n1/en/tbl/csv/18100004-eng.zip"


def download_cpi():

    try:
        os.mkdir("cpi")
    except:
        logging.warning("Could not create directory, probably already exists")

    cpi_result = requests.get(cpi_url)    

    with open("cpi/zip_cpi.zip", "wb") as f:
        f.write(cpi_result.content)

    cpi_extract = zipfile.ZipFile("cpi/zip_cpi.zip")
    cpi_extract.extractall(path="cpi")

    cpi_df = pd.read_csv("cpi/18100004.csv")

    cpi_df.columns = cpi_df.columns.str.lower()

    cpi_df = cpi_df[
        cpi_df["geo"].isin(geographical_locations)
        & cpi_df["products and product groups"].isin(major_groups)
    ]

    cpi_df["ref_date"] = pd.to_datetime(cpi_df["ref_date"])

    cpi_df = cpi_df[["ref_date", "geo", "products and product groups", "value"]]

    cpi_df = cpi_df.rename(columns = {"products and product groups": "products_and_product_groups"})

    return cpi_df
