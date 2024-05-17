# from tabs.data import *
from pathlib import Path
# Import data from shared.py
from faicons import icon_svg
from shiny import App, reactive, render, ui

import pandas as pd

boc_rates = pd.read_parquet(Path(__file__).parent/ "data/boc_rates.parquet")
boc_rates.rename(columns={"ref_date": "date"}, inplace=True)

cpi = pd.read_parquet(Path(__file__).parent / "data/cpi.parquet")
cpi = cpi[cpi["ref_date"] > "2001-01-01"]

basket_weights = pd.read_parquet(Path(__file__).parent / "data/basket_weights.parquet")
basket_weights = basket_weights[
    basket_weights["price_period_of_weight"]
    == "Weight at basket reference period prices"
]
basket_weights = basket_weights[
    ["ref_date", "geo", "products_and_product_groups", "value"]
]
basket_weights.rename(columns={"value": "basket_weights"}, inplace=True)

basket_weights = basket_weights.merge(
    pd.read_parquet(Path(__file__).parent / "data/basket_weights_timewindow.parquet"),
    on="ref_date",
    how="inner",
)
basket_weights.drop(["start_month", "end_month"], axis=1, inplace=True)

gvt_bonds = pd.read_parquet(Path(__file__).parent / 'data/gvt_bonds.parquet')

app_ui = ui.page_sidebar(
    ui.sidebar(
        ui.input_checkbox_group(
            "selected_geo",
            "Selected Geography",
            cpi['geo'].drop_duplicates().tolist(),
            selected=["Canada"],
        ),
        title="Filter controls",
    ),
    ui.layout_column_wrap(
        ui.value_box(
            "Latest CPI",
            ui.output_text("latest_cpi"),
            showcase=icon_svg("earlybirds"),
        ),
        ui.value_box(
            "Latest Date",
            ui.output_text("cpi_date"),
            showcase=icon_svg("ruler-horizontal"),
        ),
        fill=False,
    ),
    ui.layout_columns(
        ui.card(
            ui.card_header("Penguin data"),
            ui.output_data_frame("summary_statistics"),
            full_screen=True,
        ),
    ),
    # ui.include_css(app_dir / "styles.css"),
    title="Penguins dashboard",
    fillable=True,
)


def server(input, output, session):
    @reactive.calc
    def filtered_df():
        filt_df = cpi[cpi["geo"].isin(input.selected_geo())]
        return filt_df

    @render.text
    def latest_cpi():
        return filtered_df()['value'].iloc[-1]

    @render.text
    def cpi_date():
        return f"{filtered_df()['ref_date'].iloc[-1]}"

    @render.data_frame
    def summary_statistics():
        cols = [
            "ref_date",
            "geo",
            "products_and_product_groups",
            "value"
        ]
        return render.DataGrid(filtered_df()[cols], filters=True)


app = App(app_ui, server)