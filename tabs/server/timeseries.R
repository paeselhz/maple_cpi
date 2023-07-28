
max_cpi_date <-
  ymd(max(cpi$ref_date))

min_cpi_date <-
  ymd(min(cpi$ref_date))

observeEvent(input$timeseries_manual_range, {
  
  manual_range_selected <-
    input$timeseries_manual_range
  
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
    inputId = "timeseries_date_range",
    value = date_ranges
  )
  
})

observeEvent(input$timeseries_date_range, {
  
  date_range <-
    input$timeseries_date_range
  
  if(length(date_range) == 2) {
    
    if(date_range[2] != max_cpi_date) {
      
      updateRadioGroupButtons(
        session = session,
        inputId = "timeseries_manual_range",
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
        inputId = "timeseries_manual_range",
        selected = NA
      )
      
    }
    
  }
  
})

click_province <- 
  eventReactive(
    input$select_province_map_click, 
    {
      
      if(is.null(input$select_province_map_shape_click)) {
        
        return("Canada")
        
      } else {
        
        if(input$select_province_map_click$lat != input$select_province_map_shape_click$lat) {
          
          return("Canada")
          
        } else {
         
          shape_click_info <- input$select_province_map_shape_click
          
          shape_click_id <- shape_click_info$id
          
          return(shape_click_id)
           
        }
         
      }
      
    })

observe({
  
  updatePickerInput(
    session = session, 
    inputId = 'selected_geography', 
    selected = click_province()
  )
  
})

output$render_cards <-
  renderUI({
    
    selected_geography <-
      input$selected_geography
    
    selected_group <-
      input$selected_group
    
    if(
      selected_geography == "Canada"
    ) {
      
      if(selected_group == "All-items") {
        
        latest_cpi_canada_all_items <-
          calculate_mom_yoy(cpi, "Canada", selected_group) %>% 
          filter(
            !is.na(yoy),
            ref_date == max(ref_date)
          )
        
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
        
        latest_cpi_canada_user_input <-
          calculate_mom_yoy(cpi, "Canada", "All-items") %>% 
          filter(
            !is.na(yoy),
            ref_date == max(ref_date)
          )
        
        latest_cpi_user_input <-
          calculate_mom_yoy(cpi, "Canada", selected_group) %>% 
          filter(
            !is.na(yoy),
            ref_date == max(ref_date)
          )
        
        fluidRow(
          column(
            width = 3,
            card_info(
              text = paste0("Latest CPI YoY%"),
              value = latest_cpi_canada_user_input$yoy,
              color = "#e6e6e6",
              region = "Canada"
            )
          ),
          column(
            width = 3,
            card_info(
              text = paste0("Latest CPI MoM%"),
              value = latest_cpi_canada_user_input$mom,
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
              region = "Canada"
            )
          ),
          column(
            width = 3,
            card_info(
              text = paste0("Latest CPI MoM% - ", selected_group),
              value = latest_cpi_user_input$mom,
              color = "#e6e6e6",
              region = "Canada"
            )
          )
        )
        
        
      }
      
      
      
    } else {
      
      latest_cpi_canada_user_input <-
        calculate_mom_yoy(cpi, "Canada", selected_group) %>% 
        filter(
          !is.na(yoy),
          ref_date == max(ref_date)
        )
      
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
            text = paste0("Latest CPI YoY% - ", selected_group),
            value = latest_cpi_canada_user_input$yoy,
            color = "#e6e6e6",
            region = "Canada"
          )
        ),
        column(
          width = 3,
          card_info(
            text = paste0("Latest CPI MoM% - ", selected_group),
            value = latest_cpi_canada_user_input$mom,
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
    
    date_range <- 
      input$timeseries_date_range
    
    selected_ema_window <-
      ifelse(input$checkbox_ema, input$ema_window, 0)
    
    if(
      selected_geography == "Canada"
    ) {
      
      if(selected_group == "All-items") {
        
        fluidRow(
          column(
            width = 12,
            cpi %>% 
              filter(
                ref_date >= date_range[1],
                ref_date <= date_range[2]
              ) %>% 
              highchart_cpi_yoy_mom(ema = selected_ema_window)
          )
        )
        
      } else {
        
        fluidRow(
          column(
            width = 6,
            cpi %>% 
              filter(
                ref_date >= date_range[1],
                ref_date <= date_range[2]
              ) %>% 
              highchart_cpi_yoy_mom("Canada", "All-items", ema = selected_ema_window)
          ),
          column(
            width = 6,
            cpi %>% 
              filter(
                ref_date >= date_range[1],
                ref_date <= date_range[2]
              ) %>% 
              highchart_cpi_yoy_mom("Canada", selected_group, ema = selected_ema_window)
          )
        )
        
      }
      
      
      
    } else {
      
      fluidRow(
        column(
          width = 6,
          cpi %>% 
            filter(
              ref_date >= date_range[1],
              ref_date <= date_range[2]
            ) %>% 
            highchart_cpi_yoy_mom("Canada", selected_group, ema = selected_ema_window)
        ),
        column(
          width = 6,
          cpi %>% 
            filter(
              ref_date >= date_range[1],
              ref_date <= date_range[2]
            ) %>% 
            highchart_cpi_yoy_mom(selected_geography, selected_group, ema = selected_ema_window)
        )
      )
      
    }
    
  })

output$select_province_map <-
  renderLeaflet({
    
    selected_geography <-
      input$selected_geography
    
    if(selected_geography == "Canada") {
      
      leaflet()  %>% 
        addTiles() %>% 
        addPolygons(data = map_provinces, weight = 5, col = 'red', layerId = ~PRENAME)
      
    } else {
      
      prov_map_bounds <-
        map_provinces %>% 
        filter(
          PRENAME == selected_geography
        ) %>% 
        sf::st_bbox() %>% 
        unname()
      
      leaflet()  %>% 
        addTiles() %>% 
        addPolygons(data = map_provinces, weight = 5, col = 'red', layerId = ~PRENAME) %>% 
        fitBounds(lng1 = prov_map_bounds[1], 
                  lat1 = prov_map_bounds[2], 
                  lng2 = prov_map_bounds[3], 
                  lat2 = prov_map_bounds[4])
      
    }
    
    
    
  })
