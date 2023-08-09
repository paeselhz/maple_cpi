
timeseries_main <-
  function(
    df, date_range, ema = 0,
    selected_geography = "Canada", selected_group = "All-items", icon = NA
  ) {
    
    cpi_calculated <-
      calculate_mom_yoy(df, selected_geography, selected_group, ema_window = ema) %>% 
      filter(
        !is.na(yoy)
      )
    
    column(
      width = 12,
      fluidRow(
        column(
          class = "column-cards",
          width = 6,
          card_info(
            text = paste0("Latest CPI YoY% - ", selected_group),
            value = cpi_calculated %>% filter(ref_date == max(ref_date)) %>% pull(yoy),
            color = "#727272",
            region = selected_geography,
            icon = icon
          )
        ),
        column(
          class = "column-cards",
          width = 6,
          card_info(
            text = paste0("Latest CPI MoM% - ", selected_group),
            value = cpi_calculated %>% filter(ref_date == max(ref_date)) %>% pull(mom),
            color = "#727272",
            region = selected_geography,
            icon = icon
          )
        )
      ),
      cpi_calculated %>% 
        highchart_cpi_yoy_mom(date_range = date_range, ema = ema)
    )
          
  }
