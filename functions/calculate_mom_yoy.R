
calculate_mom_yoy <-
  function(df, selected_geography, selected_group, ema_window) {
    
    mom_yoy_df <-
      df %>% 
      filter(
        geo == selected_geography,
        products_and_product_groups %in% selected_group
      ) %>% 
      group_by(
        products_and_product_groups
      ) %>% 
      arrange(ref_date) %>% 
      reframe(
        ref_date = ref_date,
        mom = round((value/lag(value) - 1) * 100, digits = 3),
        yoy = round((value/lag(value, 12) - 1) * 100, digits = 3)
      ) %>% 
      ungroup() %>% 
      filter(
        !is.na(yoy)
      ) %>% 
      mutate(
        ema = pracma::movavg(yoy, ema_window, type = "e")
      )
    
    return(mom_yoy_df)
    
  }
