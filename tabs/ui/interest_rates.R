interest_rates <-
  tabPanel(
    title = "Interest rates",
    value = "interest_rates",
    fluidRow(
      column(
        width = 3
      ),
      column(
        width = 6,
        radioGroupButtons(
          inputId = "interest_rates_manual_range",
          label = "Time frame",
          choices = c("All" = -1, "1 Year" = 1, "2 Years" = 2, "3 Years" = 3, "5 Years" = 5),
          selected = 5,
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
        width = 3,
        airDatepickerInput(
          inputId = "interest_rates_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(ymd(max(boc_rates$date) - years(5)), max(boc_rates$date)) + 1
        )
      )
    ),
    fluidRow(
      highchartOutput("interest_rates_plot") %>% 
        withSpinner(type = 4, color = "#e6e6e6")
    )
  )
