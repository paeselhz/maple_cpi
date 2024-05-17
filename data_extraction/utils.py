import os
import shutil
import zipfile

import pandas as pd
import requests


class DataExtraction:

    def __init__(self):
        self.boc_rates_url = (
            "https://www150.statcan.gc.ca/n1/en/tbl/csv/10100139-eng.zip"
        )
        self.boc_rates_columns = [
            "Overnight money market financing",
            "Bank rate",
            "Target rate",
        ]
        self.boc_rates_col_replace = {
            "Overnight money market financing": "corra",
            "Bank rate": "bank_rate",
            "Target rate": "overnight_target",
        }
        self.cpi_geographical_locations = [
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

        self.cpi_major_groups = [
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

        self.cpi_url = "https://www150.statcan.gc.ca/n1/en/tbl/csv/18100004-eng.zip"

        self.gvt_bonds_url = (
            "https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/csv"
        )

    def download_boc_rates(self):

        if not os.path.exists("boc_rates"):
            os.makedirs("boc_rates")

        boc_request = requests.get(self.boc_rates_url)

        with open("boc_rates/boc_rates.zip", "wb") as f:
            f.write(boc_request.content)

        boc_extract = zipfile.ZipFile("boc_rates/boc_rates.zip")
        boc_extract.extractall("boc_rates")

        boc_rates_df = pd.read_csv("boc_rates/10100139.csv", low_memory=False)

        boc_rates_df.columns = boc_rates_df.columns.str.lower()

        boc_rates_df = boc_rates_df[
            boc_rates_df["financial market statistics"].isin(self.boc_rates_columns)
            & ~boc_rates_df["value"].isna()
            & (boc_rates_df["ref_date"] >= "2002-01-01")
        ]

        boc_rates_df["financial market statistics"] = boc_rates_df[
            "financial market statistics"
        ].replace(self.boc_rates_col_replace)

        boc_rates_df = boc_rates_df[
            ["ref_date", "financial market statistics", "value"]
        ]

        # Pivot data
        boc_rates_pivot = boc_rates_df.pivot_table(
            index="ref_date", columns="financial market statistics", values="value"
        )

        # Reset index
        boc_rates_pivot.reset_index(inplace=True)

        self.boc_rates = boc_rates_pivot.copy()

        return True

    def download_cpi(self):

        if not os.path.exists("cpi"):
            os.makedirs("cpi")

        cpi_request = requests.get(self.cpi_url)

        with open("cpi/cpi.zip", "wb") as f:
            f.write(cpi_request.content)

        cpi_extract = zipfile.ZipFile("cpi/cpi.zip")
        cpi_extract.extractall("cpi")

        cpi_df = pd.read_csv("cpi/18100004.csv", low_memory=False)

        cpi_df.columns = cpi_df.columns.str.lower()

        cpi_df = cpi_df[
            cpi_df["geo"].isin(self.cpi_geographical_locations)
            & cpi_df["products and product groups"].isin(self.cpi_major_groups)
        ]

        cpi_df["ref_date"] = pd.to_datetime(cpi_df["ref_date"])

        cpi_df = cpi_df[["ref_date", "geo", "products and product groups", "value"]]

        cpi_df = cpi_df.rename(
            columns={"products and product groups": "products_and_product_groups"}
        )

        self.cpi = cpi_df.copy()

        return True

    def download_government_bonds(self):

        self.gvt_bonds = pd.read_csv(self.gvt_bonds_url, skiprows=27)

    def clean(self):
        shutil.rmtree("boc_rates")
        shutil.rmtree("cpi")
