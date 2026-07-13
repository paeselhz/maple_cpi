group_analysis <-
  tabPanel(
    title = "Group Analysis",
    value = "group_analysis",
    hr(),
    fluidRow(
      column(
        width = 3,
        radioGroupButtons(
          inputId = "comparison_yoy_mom",
          label = " ",
          choices = c("YoY" = "yoy", "MoM" = "mom"),
          selected = "yoy",
          individual = TRUE,
          justified = TRUE
        )
      ),
      column(
        width = 5,
        radioGroupButtons(
          inputId = "group_analysis_manual_range",
          label = "Time frame",
          choices = c("All" = -1, "1 Year" = 1, "2 Years" = 2, "3 Years" = 3, "5 Years" = 5),
          selected = 5,
          individual = TRUE,
          justified = TRUE,
          checkIcon = list(
            yes = tags$i(class = "fa fa-circle"),
            no = tags$i(class = "fa fa-circle-o")
          )
        )
      ),
      column(
        width = 3,
        airDatepickerInput(
          inputId = "group_analysis_date_range",
          label = "Select a date range",
          range = TRUE,
          value = c(ymd(max(cpi$ref_date)) - years(5), max(cpi$ref_date))
        )
      ),
      column(
        width = 1,
        div(
          class = "custom_actionBttn",
          actionBttn(
            inputId = "show_group_analysis_faq",
            icon = icon("question-circle"),
            color = "primary"
          )
        )
      )
    ),
    fluidRow(
      column(
        width = 12,
        tabsetPanel(
          tabPanel(
            title = "CPI Decomposition",
            value = "cpi_decomposition",
            highchartOutput("cpi_groups", height = "600px") %>% 
              withSpinner(type = 4, color = cards_color)
          ),
          tabPanel(
            title = "CPI Shares",
            value = "cpi_shares",
            highchartOutput("cpi_shares", height = "600px") %>% 
              withSpinner(type = 4, color = cards_color)
          )
        )
      )
    )
  )
