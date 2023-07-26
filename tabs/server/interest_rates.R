
observeEvent(input$interest_rates_manual_range, {
  
  manual_range_selected <-
    input$interest_rates_manual_range
  
  max_boc_date <-
    max(boc_rates$date)
  
  if(manual_range_selected == - 1) {
    
    date_ranges <-
      c(
        min(boc_rates$date),
        max(boc_rates$date)
      )
    
  } else {
    
    date_ranges <-
      c(ymd(max_boc_date) - years(manual_range_selected), max_boc_date)
    
  }
  
  updateAirDateInput(
    session = session,
    inputId = "interest_rates_date_range",
    value = date_ranges
  )
  
})

observeEvent(input$interest_rates_date_range, {
  
  date_range <-
    input$interest_rates_date_range
  
  max_boc_date <-
    max(boc_rates$date)
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_boc_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "interest_rates_manual_range",
        selected = NA
      )
      
    } else if (!date_range[1] %in% c(
      ymd(max_boc_date) - years(1),
      ymd(max_boc_date) - years(2),
      ymd(max_boc_date) - years(3),
      ymd(max_boc_date) - years(5)
    )) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "interest_rates_manual_range",
        selected = NA
      )
      
    }
      
  }
  
})

output$interest_rates_plot <-
  renderHighchart({
    
    date_range <-
      input$interest_rates_date_range
    
    if(length(date_range) == 2) {
      
      filtered_df <-
        boc_rates %>% 
        filter(
          date >= date_range[1] & date <= date_range[2]
        ) %>% 
        arrange(date)
      
      filtered_df %>% 
        hchart(
         "line",
         hcaes(x = date, y = overnight_target),
         name = "Target Rate %"
        ) %>% 
        hc_add_series(
          data = filtered_df,
          type = "line",
          hcaes(x = date, y = bank_rate),
          name = "Bank Rate %"
        ) %>% 
        hc_add_series(
          data = filtered_df,
          type = "line",
          hcaes(x = date, y = corra),
          name = "CORRA % - Canadian Overnight Repo Rate Average"
        ) %>% 
        hc_xAxis(
          title = list(text = "Reference Date")
        ) %>% 
        hc_yAxis(
          title = list(text = "Rates %")
        ) %>% 
        hc_tooltip(
          shared = TRUE
        ) %>% 
        hc_title(
          text = "Interest Rates"
        ) %>% 
        hc_subtitle(
          text = paste0("From ", date_range[1], " to ", date_range[2])
        ) %>% 
        hc_caption(
          text = "Source: Bank of Canada"
        ) %>% 
        hc_exporting(
          enabled = TRUE
        )
      
    }
    
  })
