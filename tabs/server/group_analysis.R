
max_cpi_date <-
  ymd(max(cpi$ref_date))

min_cpi_date <-
  ymd(min(cpi$ref_date))

observeEvent(input$group_analysis_manual_range, {
  
  manual_range_selected <-
    input$group_analysis_manual_range
  
  if(manual_range_selected == - 1) {
    
    date_ranges <-
      c(
        min_cpi_date,
        max_cpi_date
      ) + 1
    
  } else {
    
    date_ranges <-
      c(max_cpi_date - years(manual_range_selected), max_cpi_date)
    
    # XGH to solve the issue between date in function and AirDatePickerInput
    date_ranges <-
      date_ranges + 1
    
  }
  
  print(date_ranges)
  
  updateAirDateInput(
    session = session,
    inputId = "group_analysis_date_range",
    value = date_ranges
  )
  
})

observeEvent(input$group_analysis_date_range, {
  
  date_range <-
    input$group_analysis_date_range
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_cpi_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "group_analysis_manual_range",
        selected = NA
      )
      
    } else if (!date_range[1] %in% c(
      max_cpi_date - years(1),
      max_cpi_date - years(2),
      max_cpi_date - years(3),
      max_cpi_date - years(5)
    )) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "group_analysis_manual_range",
        selected = NA
      )
      
    }
    
  }
  
})

output$cpi_groups <-
  renderHighchart({
    
    date_range <-
      input$group_analysis_date_range
    
    selected_comparison <-
      input$comparison_yoy_mom
    
    calculate_mom_yoy(cpi, "Canada", major_groups[2:9], ema_window = 0) %>% 
      filter(
        !is.na(yoy),
        ref_date >= date_range[1],
        ref_date <= date_range[2]
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
        contribution = !!sym(selected_comparison)*basket_weights/100
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
        text = paste0(
          "CPI ", 
          ifelse(selected_comparison == "mom", "MoM", "YoY"), 
          " % by Major Groups of Products"
        )
      ) %>% 
      hc_exporting(
        enabled = TRUE
      ) %>% 
      hc_add_theme(
        maple_cpi_theme
      )
    
  })

output$cpi_shares <-
  renderHighchart({
    
    date_range <-
      input$group_analysis_date_range
    
    selected_comparison <-
      input$comparison_yoy_mom
    
    calculate_mom_yoy(cpi, "Canada", major_groups[2:9], ema_window = 0) %>% 
      filter(
        !is.na(yoy),
        ref_date >= date_range[1],
        ref_date <= date_range[2]
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
        abs_contribution = abs(!!sym(selected_comparison))*basket_weights/100
      ) %>% 
      group_by(ref_date) %>% 
      mutate(
        sum_abs_contribution = sum(abs_contribution)
      ) %>% 
      ungroup() %>% 
      mutate(
        share_abs_contribution = (abs_contribution/sum_abs_contribution)*100
      ) %>% 
      select(
        ref_date,
        products_and_product_groups,
        share_abs_contribution
      ) %>% 
      hchart(
        "column",
        hcaes(x = ref_date, y = share_abs_contribution, group = "products_and_product_groups"),
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
        text = paste0(
          "CPI ", 
          ifelse(selected_comparison == "mom", "MoM", "YoY"), 
          " % by Major Groups of Products"
        )
      ) %>% 
      hc_subtitle(
        text = paste0(
          "Share of monthly contribution to CPI"
        )
      ) %>% 
      hc_exporting(
        enabled = TRUE
      ) %>% 
      hc_add_theme(
        maple_cpi_theme
      )
    
    
  })
