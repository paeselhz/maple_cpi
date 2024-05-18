from pathlib import Path
import fastparquet
from faicons import icon_svg
from shiny import App, reactive, render, ui
from tabs.data import *
from tabs.ui.about import about_panel

app_ui = ui.page_fluid(
    ui.tags.style(
        "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');"
    ),
    ui.head_content(ui.include_css(Path(__file__).parent / "www/styles.css")),
    ui.page_navbar(

    about_panel, 
    
    title = "Maple CPI", 
    id="navbar"
    )
)


def server(input, output, session):
    @reactive.calc
    def filtered_df():
        filt_df = cpi[cpi["geo"].isin(input.selected_geo())]
        return filt_df

    @render.text
    def latest_cpi():
        return filtered_df()["value"].iloc[-1]

    @render.text
    def cpi_date():
        return f"{filtered_df()['ref_date'].iloc[-1]}"

    @render.data_frame
    def summary_statistics():
        cols = ["ref_date", "geo", "products_and_product_groups", "value"]
        return render.DataGrid(filtered_df()[cols], filters=True)


app = App(app_ui, server)
