shinyUI(
  fluidPage(
    tags$div(icon("check"), style = "display: none;"),
    navbarPage(
      title = "Maple CPI",
      theme = "styles.css",
      id = "navbar",
      selected = "home",
      fluid = T,
      home,
      timeseries,
      group_analysis,
      interest_rates,
      cpi_simulation
    )
  )
)