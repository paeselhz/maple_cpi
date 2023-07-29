home <-
  tabPanel(
    title = "Home",
    value = "home",
    hr(),
    h1("Maple CPI - Canadian CPI explorer", style = "text-align: center;"),
    fluidRow(
      column(
        width = 12,
        hr(),
        uiOutput("home_cards_economy")
      )
    ),
    fluidRow(
      column(
        width = 12,
        class = "home-text-box",
        h3("Canadian Consumer Price Index"),
        p("explaining CPI? Datasources?"),
      ) 
    )
  )
