
max_cpi_date <-
  ymd(max(cpi$ref_date))

min_cpi_date <-
  ymd(min(cpi$ref_date))

observeEvent(input$simulation_manual_range, {
  
  manual_range_selected <-
    input$simulation_manual_range
  
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
  
  updateAirDateInput(
    session = session,
    inputId = "simulation_date_range",
    value = date_ranges
  )
  
})

observeEvent(input$simulation_date_range, {
  
  date_range <-
    input$simulation_date_range
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_cpi_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "simulation_manual_range",
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
        inputId = "simulation_manual_range",
        selected = NA
      )
      
    }
    
  }
  
})

output$cpi_simulation <-
  renderHighchart({

    date_range <-
      input$simulation_date_range

    selected_groups <-
      input$simulation_cpi_groups
    
    if(length(selected_groups) > 0) {
      
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
          contribution = yoy*basket_weights/100
        ) %>% 
        filter(
          products_and_product_groups %in% selected_groups
        ) %>% 
        group_by(
          ref_date
        ) %>% 
        summarise(
          cpi_ex_groups = sum(contribution)
        ) %>% 
        hchart(
          "line",
          hcaes(x = ref_date, y = cpi_ex_groups),
          name = "Canadian CPI - YoY% - Custom selection"
        ) %>% 
        hc_add_series(
          data = calculate_mom_yoy(cpi, "Canada", "All-items") %>% 
            filter(
              !is.na(yoy),
              ref_date >= date_range[1],
              ref_date <= date_range[2]
            ),
          type = "line",
          hcaes(x = ref_date, y = yoy),
          name = "Canadian CPI - YoY% - All-items"
        ) %>% 
        hc_tooltip(
          valueDecimals = 3,
          shared = TRUE
        ) %>% 
        hc_xAxis(
          title = list(text = "Reference Date")
        ) %>% 
        hc_yAxis(
          title = list(text = "CPI")
        ) %>% 
        hc_title(
          text = paste0(
            "CPI YoY% by Major Groups of Products"
          )
        ) %>% 
        hc_subtitle(
          text = paste0(
            "Selected groups: ", paste0(selected_groups, collapse = ", ")
          )
        ) %>% 
        hc_exporting(
          enabled = TRUE
        )
      
    }

  })
