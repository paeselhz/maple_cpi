
highchart_cpi_yoy_mom <-
  function(df, date_range, ema = 0) {
    
    selected_geography <-
      df %>% 
      pull(geo) %>% 
      unique()
    
    selected_group <-
      df %>% 
      pull(products_and_product_groups) %>% 
      unique()
    
    df_filtered <-
      df %>% 
      filter(
        ref_date >= date_range[1],
        ref_date <= date_range[2],
        !is.na(yoy)
      )
    
    hc_return <-
      df_filtered %>% 
      hchart(
        "line",
        hcaes(x = ref_date, y = yoy),
        name = "CPI Year-Over-Year"
      ) %>% 
      hc_add_series(
        data = df_filtered,
        type = "line",
        hcaes(x = ref_date, y = mom),
        name = "CPI Month-Over-Month"
      ) %>% 
      hc_tooltip(
        valueDecimals = 3,
        shared = TRUE
      ) %>% 
      hc_xAxis(
        title = list(text = "Reference Date")
      ) %>% 
      hc_yAxis(
        title = list(text = "Rates %")
      ) %>% 
      hc_title(
        text = paste0(
          "CPI data for: ", selected_group, " - ", selected_geography
        )
      ) %>% 
      hc_exporting(
        enabled = TRUE
      ) %>% 
      hc_add_theme(
        maple_cpi_theme
      )
    
    if(ema) {
      
      hc_return %>% 
        hc_add_series(
          data = df_filtered,
          type = "line",
          hcaes(x = ref_date, y = ema),
          name = paste0("YoY% Exp. Moving Average - ", ema, " Months")
        )
      
    } else {
      
      hc_return
      
    }
    
  }
