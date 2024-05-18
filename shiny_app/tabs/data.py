import pandas as pd

boc_rates = pd.read_parquet("data/boc_rates.parquet")
boc_rates.rename(columns={"ref_date": "date"}, inplace=True)

cpi = pd.read_parquet("data/cpi.parquet")
cpi = cpi[cpi["ref_date"] > "2001-01-01"]

basket_weights = pd.read_parquet("data/basket_weights.parquet")
basket_weights = basket_weights[
    basket_weights["price_period_of_weight"]
    == "Weight at basket reference period prices"
]
basket_weights = basket_weights[
    ["ref_date", "geo", "products_and_product_groups", "value"]
]
basket_weights.rename(columns={"value": "basket_weights"}, inplace=True)

basket_weights = basket_weights.merge(
    pd.read_parquet("data/basket_weights_timewindow.parquet"),
    on="ref_date",
    how="inner",
)
basket_weights.drop(["start_month", "end_month"], axis=1, inplace=True)

gvt_bonds = pd.read_parquet('data/gvt_bonds.parquet')