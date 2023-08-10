
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
      # df_filtered %>%
      # highchart() %>% 
      # hc_yAxis_multiples(
      #   list(title = list(text = "Rates %"), opposite = FALSE),
      #   list(showLastLabel = FALSE, opposite = TRUE, title = list(text = "CPI raw value"))
      # ) %>%
      # hc_add_series(
      df_filtered %>% 
      hchart(
        # data = df_filtered,
        "line",
        hcaes(x = ref_date, y = yoy),
        name = "CPI Year-Over-Year",
        yAxis = 0,
        color = c("#E53622")
      ) %>% 
      hc_add_series(
        data = df_filtered,
        type = "line",
        hcaes(x = ref_date, y = mom),
        name = "CPI Month-Over-Month",
        yAxis = 0,
        color = c("#4F2824")
      ) %>% 
      # hc_add_series(
      #   data = df_filtered,
      #   type = "line",
      #   hcaes(x = ref_date, y = cpi_level),
      #   yAxis = 1
      # ) %>% 
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
      hc_legend(
        enabled = TRUE,
        align = "bottom",
        layout = "horizontal"
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
          name = paste0("YoY% Exp. Moving Average - ", ema, " Months"),
          color = c("#009949")
        )
      
    } else {
      
      hc_return
      
    }
    
  }
