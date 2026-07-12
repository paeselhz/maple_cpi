
plot_policy_rates <-
  function(boc_rates, date_range) {
    
    filtered_df <-
      boc_rates %>% 
      filter(
        date >= date_range[1] & date <= date_range[2]
      ) %>% 
      arrange(date)
    
    filtered_df %>% 
      hchart(
        "line",
        hcaes(x = date, y = overnight_target),
        name = "Policy Rate %",
        color = c("#E53622")
      ) %>% 
      hc_add_series(
        data = filtered_df,
        type = "line",
        hcaes(x = date, y = bank_rate),
        name = "Bank Rate %",
        color = c("#4F2824")
      ) %>% 
      hc_add_series(
        data = filtered_df,
        type = "line",
        hcaes(x = date, y = corra),
        name = "CORRA % - Canadian Overnight Repo Rate Average",
        color = c("#009949")
      ) %>% 
      hc_xAxis(
        title = list(text = "Reference Date")
      ) %>% 
      hc_yAxis(
        title = list(text = "Rates %")
      ) %>% 
      hc_tooltip(
        shared = TRUE
      ) %>% 
      hc_title(
        text = "Interest Rates"
      ) %>% 
      hc_subtitle(
        text = paste0("From ", date_range[1], " to ", date_range[2])
      ) %>% 
      hc_caption(
        text = "Source: Bank of Canada"
      ) %>% 
      hc_exporting(
        enabled = TRUE
      ) %>% 
      hc_add_theme(
        maple_cpi_theme
      )
    
  }

plot_gvt_bonds <-
  function(gvt_bonds, date_range) {
    
    filtered_df <-
      gvt_bonds %>% 
      filter(
        date >= date_range[1] & date <= date_range[2]
      ) %>% 
      arrange(date)
    
    filtered_df %>% 
      hchart(
        "line",
        hcaes(x = date, y = bd_cdn_2yr_dq_yld),
        name = "Benchmark Bond Yields - 2Yr",
        color = c("#E53622")
      ) %>% 
      hc_add_series(
        data = filtered_df,
        type = "line",
        hcaes(x = date, y = bd_cdn_5yr_dq_yld),
        name = "Benchmark Bond Yields - 5Yr",
        color = c("#4F2824")
      ) %>% 
      hc_add_series(
        data = filtered_df,
        type = "line",
        hcaes(x = date, y = bd_cdn_10yr_dq_yld),
        name = "Benchmark Bond Yields - 10Yr",
        color = c("#009949")
      ) %>% 
      hc_xAxis(
        title = list(text = "Reference Date")
      ) %>% 
      hc_yAxis(
        title = list(text = "Rates %")
      ) %>% 
      hc_tooltip(
        shared = TRUE
      ) %>% 
      hc_title(
        text = "Government of Canada - Benchmark Bond Yields"
      ) %>% 
      hc_subtitle(
        text = paste0("From ", date_range[1], " to ", date_range[2])
      ) %>% 
      hc_caption(
        text = "Source: Bank of Canada"
      ) %>% 
      hc_exporting(
        enabled = TRUE
      ) %>% 
      hc_add_theme(
        maple_cpi_theme
      )
    
  }
