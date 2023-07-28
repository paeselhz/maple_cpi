home <-
  tabPanel(
    title = "Home",
    value = "home",
    hr(),
    h1("Maple CPI - Canadian CPI explorer", style = "align: center;"),
    column(
      width = 3,
      p("explaining CPI? Datasources?"),
    ),
    column(
      width = 9,
      h3("Current status of Canadian economy"),
      uiOutput("home_cards_economy")
    )
  )