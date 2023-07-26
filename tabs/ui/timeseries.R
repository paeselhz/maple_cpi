timeseries <-
  tabPanel(
    title = "Timeseries",
    value = "timeseries",
    column(
      width = 3,
      shinyWidgets::pickerInput(
        inputId = "selected_group",
        label = "Select a CPI group:",
        choices = major_groups,
        selected = major_groups[1],
        multiple = FALSE
      ),
      shinyWidgets::pickerInput(
        inputId = "selected_geography",
        label = "Select a geography:",
        choices = geographical_locations,
        selected = geographical_locations[1],
        multiple = FALSE
      ),
      p("space for map")
    ),
    column(
      width = 9,
      uiOutput("render_cards"),
      uiOutput("render_highcharts") %>% 
        withSpinner(type = 4, color = "#e6e6e6")
    )
    
  )