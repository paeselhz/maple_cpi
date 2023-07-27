
highchart_cpi_yoy_mom <-
  function(df, selected_geography = "Canada", selected_group = "All-items") {
    
    cpi_calculated <-
      calculate_mom_yoy(df, selected_geography, selected_group) %>% 
      filter(
        !is.na(yoy)
      )
    
    cpi_calculated %>% 
      hchart(
        "line",
        hcaes(x = ref_date, y = yoy),
        name = "CPI Year-Over-Year"
      ) %>% 
      hc_add_series(
        data = cpi_calculated,
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
          "CPI data for: ", selected_group
        )
      ) %>% 
      hc_subtitle(
        text = paste0(
          "Geographical location: ", selected_geography
        )
      )
    
  }