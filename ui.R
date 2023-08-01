shinyUI(
  fluidPage(
    tags$style(
      "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');"
    ),
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