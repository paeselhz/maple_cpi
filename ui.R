shinyUI(
  fluidPage(
    navbarPage(
      title = "Canadian CPI",
      theme = "styles.css",
      selected = "home",
      fluid = T,
      home,
      timeseries,
      group_analysis,
      interest_rates
    )
  )
)