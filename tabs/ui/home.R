home <-
  tabPanel(
    title = "Home",
    value = "home",
    hr(),
    h1("Canadian CPI explorer", style = "align: center;"),
    column(
      width = 3,
      p("explaining CPI? Datasources?"),
    ),
    column(
      width = 9,
      h3("Current status of Canadian economy"),
      p("Add cards here (CPI YOY, MOM, Interest rate?)")
    )
  )