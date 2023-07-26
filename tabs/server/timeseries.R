output$render_cards <-
  renderUI({
    
    selected_geography <-
      input$selected_geography
    
    selected_group <-
      input$selected_group
    
    latest_cpi_canada_all_items <-
      calculate_mom_yoy(cpi, "Canada", "All-items") %>% 
      filter(
        !is.na(yoy),
        ref_date == max(ref_date)
      )
    
    if(
      selected_geography == "Canada" & selected_group == "All-items"
    ) {
      
      fluidRow(
        column(
          width = 6,
          card_info(
            text = "Latest CPI YoY%",
            value = latest_cpi_canada_all_items$yoy,
            color = "#e6e6e6",
            region = "Canada"
          )
        ),
        column(
          width = 6,
          card_info(
            text = "Latest CPI MoM%",
            value = latest_cpi_canada_all_items$mom,
            color = "#e6e6e6",
            region = "Canada"
          )
        )
      )
      
    } else {
      
      latest_cpi_user_input <-
        calculate_mom_yoy(cpi, selected_geography, selected_group) %>% 
        filter(
          !is.na(yoy),
          ref_date == max(ref_date)
        )
      
      fluidRow(
        column(
          width = 3,
          card_info(
            text = "Latest CPI YoY%",
            value = latest_cpi_canada_all_items$yoy,
            color = "#e6e6e6",
            region = "Canada"
          )
        ),
        column(
          width = 3,
          card_info(
            text = "Latest CPI MoM%",
            value = latest_cpi_canada_all_items$mom,
            color = "#e6e6e6",
            region = "Canada"
          )
        ),
        column(
          width = 3,
          card_info(
            text = paste0("Latest CPI YoY% - ", selected_group),
            value = latest_cpi_user_input$yoy,
            color = "#e6e6e6",
            region = selected_geography
          )
        ),
        column(
          width = 3,
          card_info(
            text = paste0("Latest CPI MoM% - ", selected_group),
            value = latest_cpi_user_input$mom,
            color = "#e6e6e6",
            region = selected_geography
          )
        )
      )
      
    }
    
  })

output$render_highcharts <-
  renderUI({
    
    selected_group <-
      input$selected_group
    
    selected_geography <-
      input$selected_geography
    
    if(
      selected_geography == "Canada" & selected_group == "All-items"
    ) {
      
      fluidRow(
        column(
          width = 12,
          highchart_cpi_yoy_mom(cpi)
        )
      )
      
    } else {
      
      fluidRow(
        column(
          width = 6,
          highchart_cpi_yoy_mom(cpi)
        ),
        column(
          width = 6,
          highchart_cpi_yoy_mom(cpi, selected_geography, selected_group)
        )
      )
      
    }
    
  })