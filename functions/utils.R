
maple_cpi_theme <-
  hc_theme(
    title = list(
      style = list(
        fontFamily = "Montserrat"
      )
    ),
    subtitle = list(
      style = list(
        fontFamily = "Montserrat"
      )
    ),
    legend = list(
      itemStyle = list(
        fontFamily = "Montserrat"
      )
    )
  )

card_info <-
  function(text, value, region, color) {
    
    shiny::HTML(
      paste0(
        '<div class = "card-info" style = "background-color:', color, ';">
            <span class = "name">', text, '</span>
            <span class = "value">', value, '%</span>
            <span class = "region">', region, '</span>
        </div>'
      )
    )
    
  }
