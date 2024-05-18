
max_boc_date <-
  ymd(max(boc_rates$date))

min_boc_date <-
  ymd(min(boc_rates$date))

observeEvent(input$interest_rates_manual_range, {
  
  manual_range_selected <-
    input$interest_rates_manual_range
  
  if(manual_range_selected == - 1) {
    
    date_ranges <-
      c(
        min_boc_date,
        max_boc_date
      ) + 1
    
  } else {
    
    date_ranges <-
      c(max_boc_date - years(manual_range_selected), max_boc_date) + 1
    
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
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_boc_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "interest_rates_manual_range",
        selected = NA
      )
      
    } else if (!date_range[1] %in% c(
      max_boc_date - years(1),
      max_boc_date - years(2),
      max_boc_date - years(3),
      max_boc_date - years(5)
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
      
      # plot_policy_rates(boc_rates, date_range)
      plot_gvt_bonds(gvt_bonds, date_range)
      
    }
    
  })
