
observeEvent(input$group_analysis_manual_range, {
  
  manual_range_selected <-
    input$group_analysis_manual_range
  
  max_cpi_date <-
    max(cpi$ref_date)
  
  if(manual_range_selected == - 1) {
    
    date_ranges <-
      c(
        min(cpi$ref_date),
        max(cpi$ref_date)
      )
    
  } else {
    
    date_ranges <-
      c(ymd(max_cpi_date) - years(manual_range_selected), max_cpi_date)
    
  }
  
  updateAirDateInput(
    session = session,
    inputId = "group_analysis_date_range",
    value = date_ranges
  )
  
})

observeEvent(input$group_analysis_date_range, {
  
  date_range <-
    input$group_analysis_date_range
  
  max_cpi_date <-
    max(cpi$ref_date)
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_cpi_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "group_analysis_manual_range",
        selected = NA
      )
      
    } else if (!date_range[1] %in% c(
      ymd(max_cpi_date) - years(1),
      ymd(max_cpi_date) - years(2),
      ymd(max_cpi_date) - years(3),
      ymd(max_cpi_date) - years(5)
    )) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "group_analysis_manual_range",
        selected = NA
      )
      
    }
    
  }
  
})

output$cpi_yoy_groups <-
  renderHighchart({
    
    calculate_mom_yoy(cpi, "Canada", major_groups[2:9]) %>% 
      filter(
        !is.na(yoy),
        ref_date >= "2018-01-01"
      ) %>% 
      full_join(
        basket_weights %>% 
          filter(geo == "Canada") %>% 
          select(
            products_and_product_groups,
            basket_weights,
            start_month,
            end_month
          ),
        by = "products_and_product_groups",
        relationship = "many-to-many"
      ) %>% 
      filter(
        ref_date >= start_month & ref_date <= end_month
      ) %>% 
      mutate(
        contribution = yoy*basket_weights/100
      ) %>% 
      hchart(
        "column",
        hcaes(x = ref_date, y = contribution, group = "products_and_product_groups"),
        stacking = "normal"
      ) %>% 
      hc_tooltip(
        valueDecimals = 3
      ) %>% 
      hc_xAxis(
        title = list(text = "Reference Date")
      ) %>% 
      hc_yAxis(
        title = list(text = "CPI")
      ) %>% 
      hc_title(
        text = "CPI YoY % by Major Groups of Products"
      )
    
  })

output$cpi_mom_groups <-
  renderHighchart({
    
    calculate_mom_yoy(cpi, "Canada", major_groups[2:9]) %>% 
      filter(
        !is.na(yoy),
        ref_date >= "2018-01-01"
      ) %>% 
      full_join(
        basket_weights %>% 
          filter(geo == "Canada") %>% 
          select(
            products_and_product_groups,
            basket_weights,
            start_month,
            end_month
          ),
        by = "products_and_product_groups",
        relationship = "many-to-many"
      ) %>% 
      filter(
        ref_date >= start_month & ref_date <= end_month
      ) %>% 
      mutate(
        contribution = mom*basket_weights/100
      ) %>% 
      hchart(
        "column",
        hcaes(x = ref_date, y = contribution, group = "products_and_product_groups"),
        stacking = "normal"
      ) %>% 
      hc_tooltip(
        valueDecimals = 3
      ) %>% 
      hc_xAxis(
        title = list(text = "Reference Date")
      ) %>% 
      hc_yAxis(
        title = list(text = "CPI")
      ) %>% 
      hc_title(
        text = "CPI MoM % by Major Groups of Products"
      )
    
  })
