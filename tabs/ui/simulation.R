cpi_simulation <-
  tabPanel(
    title = "Simulation",
    value = "simulation",
    fluidRow(
      column(
        width = 3,
        pickerInput(
          inputId = "simulation_cpi_groups",
          label = "Selected groups for custom CPI",
          choices = major_groups[2:9],
          selected = major_groups[2:9],
          options = list(`actions-box` = TRUE),
          multiple = TRUE
        )
      ),
      column(
        width = 6,
        radioGroupButtons(
          inputId = "simulation_manual_range",
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
        width = 3,
        airDatepickerInput(
          inputId = "simulation_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(min(cpi$ref_date), max(cpi$ref_date)) + 1
        )
      )
    ),
    fluidRow(
      column(
        width = 12,
        highchartOutput("cpi_simulation", height = "600px") %>%
          withSpinner(type = 4, color = "#e6e6e6")
      )
    )
  )
