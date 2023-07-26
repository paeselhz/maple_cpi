
highchart_cpi_yoy_mom <-
  function(df, selected_geography = "Canada", selected_group = "All-items") {
    
    cpi_10_years <-
      calculate_mom_yoy(df, selected_geography, selected_group) %>% 
      filter(
        !is.na(yoy),
        ref_date >= as.Date("2002-01-01")
      )
    
    xts_mom <-
      xts::xts(cpi_10_years$mom, order.by = cpi_10_years$ref_date)
    
    xts_yoy <-
      xts::xts(cpi_10_years$yoy, order.by = cpi_10_years$ref_date)
    
    highchart(
      type = "stock"
    ) %>% 
      hc_add_series(
        xts_mom,
        name = "CPI Month-Over-Month"
      ) %>% 
      hc_add_series(
        xts_yoy,
        name = "CPI Year-Over-Year"
      ) %>% 
      hc_tooltip(
        valueDecimals = 3
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
