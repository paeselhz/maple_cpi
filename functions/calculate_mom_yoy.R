
calculate_mom_yoy <-
  function(df, selected_geography, selected_group) {
    
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
      ungroup()
    
    return(mom_yoy_df)
    
  }
