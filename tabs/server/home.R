
observeEvent(
  input$button_major_cpi_groups, 
  {
    
    updateTabsetPanel(session = session, inputId = "navbar", selected = "about")
    
  })

output$home_cards_economy <-
  renderUI({
    
    latest_cpi_canada <-
      calculate_mom_yoy(cpi, "Canada", "All-items") %>% 
      filter(
        !is.na(yoy)
      ) %>%
      arrange(ref_date) %>% 
      tail(1)
    
    latest_boc_target_rate <-
      boc_rates %>% 
      arrange(date) %>% 
      tail(1)
    
    fluidRow(
      column(
        class = "column-cards",
        width = 4,
        card_info(
          text = "Canadian CPI - YoY%",
          value = latest_cpi_canada$yoy,
          color = cards_color,
          region = ""
        )
      ),
      column(
        class = "column-cards",
        width = 4,
        card_info(
          text = "Canadian CPI - MoM%",
          value = latest_cpi_canada$mom,
          color = cards_color,
          region = ""
        )
      ),
      column(
        class = "column-cards",
        width = 4,
        card_info(
          text = "Target Interest Rate",
          value = latest_boc_target_rate$overnight_target,
          color = cards_color,
          region = ""
        )
      )
    )
    
  })