timeseries <-
  tabPanel(
    title = "Timeseries",
    value = "timeseries",
    fluidRow(
      column(
        width = 6,
        radioGroupButtons(
          inputId = "timeseries_manual_range",
          label = "Time frame",
          choices = c("All" = -1, "1 Year" = 1, "2 Years" = 2, "3 Years" = 3, "5 Years" = 5),
          individual = TRUE,
          justified = TRUE,
          checkIcon = list(
            yes = tags$i(class = "fa fa-circle",
                         style = "color: steel-blue"),
            no = tags$i(class = "fa fa-circle-o",
                        style = "color: steel-blue")
          )
        )
      ),
      column(
        width = 6,
        airDatepickerInput(
          inputId = "timeseries_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(min(cpi$ref_date), max(cpi$ref_date)) + 1
        )
      )
    ),
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
      leafletOutput("select_province_map")
    ),
    column(
      width = 9,
      uiOutput("render_cards"),
      uiOutput("render_highcharts") %>% 
        withSpinner(type = 4, color = "#e6e6e6")
    )
    
  )