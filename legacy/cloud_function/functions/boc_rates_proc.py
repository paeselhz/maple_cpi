import os
import shutil
import zipfile
import logging
import requests
import pandas as pd

boc_rates_url = "https://www150.statcan.gc.ca/n1/en/tbl/csv/10100139-eng.zip"


def download_boc_rates():

    try:
        os.mkdir("boc_rates")
    except:
        logging.warning("Could not create directory, probably already exists")

    boc_result = requests.get(boc_rates_url)

    with open("boc_rates/boc_rates_zip.zip", "wb") as f:
        f.write(boc_result.content)

    boc_extract = zipfile.ZipFile("boc_rates/boc_rates_zip.zip")
    boc_extract.extractall("boc_rates")

    boc_rates_df = pd.read_csv("boc_rates/10100139.csv")

    boc_rates_df.columns = boc_rates_df.columns.str.lower()

    boc_rates_df = boc_rates_df[
        boc_rates_df["financial market statistics"].isin(
            ["Overnight money market financing", "Bank rate", "Target rate"]
        )
        & ~boc_rates_df["value"].isna()
        & (boc_rates_df["ref_date"] >= "2002-01-01")
    ]

    boc_rates_df["financial market statistics"] = boc_rates_df[
        "financial market statistics"
    ].replace(
        {
            "Overnight money market financing": "corra",
            "Bank rate": "bank_rate",
            "Target rate": "overnight_target",
        }
    )

    boc_rates_df = boc_rates_df[["ref_date", "financial market statistics", "value"]]

    # Pivot data
    boc_rates_pivot = boc_rates_df.pivot_table(
        index="ref_date", columns="financial market statistics", values="value"
    )

    # Reset index
    boc_rates_pivot.reset_index(inplace=True)

    return boc_rates_pivot
