
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
