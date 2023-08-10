timeseries <-
  tabPanel(
    title = "Timeseries",
    value = "timeseries",
    hr(),
    fluidRow(
      column(
        width = 3,
        fluidRow(
          column(
            width = 6,
            shinyWidgets::awesomeCheckbox(
              inputId = "checkbox_ema",
              label = "Visualize Exponential Moving Average (EMA)",
              value = FALSE
            )
          ),
          column(
            width = 6,
            conditionalPanel(
              "input.checkbox_ema",
              # shinyWidgets::numericInputIcon(
              numericInput(
                inputId = "ema_window",
                label = "Time window for EMA",
                min = 3,
                max = 18,
                step = 1,
                value = 12
              )
            )
          )
        )
      ),
      column(
        width = 5,
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
        width = 3,
        airDatepickerInput(
          inputId = "timeseries_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(min(cpi$ref_date), max(cpi$ref_date)) + 1
        )
      ),
      column(
        width = 1,
        # column(
        #   width = 6,
        #   actionBttn(
        #     inputId = "test_bookmark",
        #     icon = icon("paper-plane")
        #   )
        # ),
        # column(
        # width = 6,
        div(
          class = "custom_actionBttn",
          actionBttn(
            inputId = "show_timeseries_faq",
            icon = icon("question-circle"),
            color = "primary"
          )
        )
        # )
      )
    ),
    column(
      width = 3,
      shinyWidgets::pickerInput(
        inputId = "selected_group",
        label = "Select a CPI group:",
        choices = major_groups,
        selected = major_groups[1],
        choicesOpt = list(
          icon = icon_groups
        ),
        multiple = FALSE
      ),
      shinyWidgets::pickerInput(
        inputId = "selected_geography",
        label = "Select a geography:",
        choices = geographical_locations,
        selected = geographical_locations[1],
        multiple = FALSE
      ),
      leafletOutput("select_province_map") %>% 
        withSpinner(type = 4, color = "#727272")
    ),
    column(
      width = 9,
      uiOutput("render_main_timeseries") %>% 
        withSpinner(type = 4, color = "#727272")
    )
    
  )