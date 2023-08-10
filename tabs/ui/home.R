home <-
  tabPanel(
    title = "Home",
    value = "home",
    class = "home-ui-panel",
    hr(),
    HTML('<h1 style="text-align:center"><strong>Maple CPI</strong> - Canadian CPI explorer</h1>'),
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
        HTML("<h1>Welcome to <strong>Maple CPI</strong></h1>"),
        br(),
        HTML(
          paste0(
            "<h4>",
            "<strong>Maple CPI</strong> is a tool developed to allow people from 
            different backgrounds to develop a better understanding to the 
            currrent state of the economy in Canada, allowing generic users to 
            grasp the information on their bills rising, while also being a tool 
            for advanced users to build analysis, develop charts and export 
            information related to the Canadian Consumer Price Index (CPI).",
            "</h4>",
            "<h4>",
            "The main focus of this project is to deliver clear insights that are
            easily understable, while maintaning the ability for more experienced
            users to explore underrated views related to the evolution of inflation
            in Canada. To achieve this goal, the project employs different data-related
            techniques, resulting in a tool that can, in a very straightforward way,
            shed some light on the economic intricacies that surround Canada.",
            "</h4>"
          )
        ),
        HTML(
          paste0(
            "<h4>",
            'If you would like to know more about the concepts used in this application,
            or you would like to know more about the <strong>Consumer Price Index</strong>,
            more known as <strong>CPI</strong>, ',
            shiny::actionLink(class = "about-link", inputId = "button_major_cpi_groups", label = "click here"),"!",
            "</h4>"
          )
        )
      ) 
    )
  )
