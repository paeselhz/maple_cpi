shinyUI(
  fluidPage(
    navbarPage(
      title = "Maple CPI",
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