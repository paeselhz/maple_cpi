group_analysis <-
  tabPanel(
    title = "Group Analysis",
    value = "group_analysis",
    fluidRow(
      column(
        width = 6,
        radioGroupButtons(
          inputId = "group_analysis_manual_range",
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
        width = 6,
        airDatepickerInput(
          inputId = "group_analysis_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(ymd(max(cpi$ref_date)) - years(5), max(cpi$ref_date)) + 1
        )
      )
    ),
    fluidRow(
      column(
        width = 6,
        highchartOutput("cpi_yoy_groups") %>% 
          withSpinner(type = 4, color = "#e6e6e6")
      ),
      column(
        width = 6,
        highchartOutput("cpi_mom_groups") %>% 
          withSpinner(type = 4, color = "#e6e6e6")
      )
    )
  )
