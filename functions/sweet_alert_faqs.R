simulation_faq <-
  function(session) {
    
    simulation_faq_text <-
      HTML(
        paste0(
          "For this tab, the user can create different scenarios related to
        the Canadian Consumer Price Index, most known as CPI. They can create
        customized indexes using one (or more) of the eight major inflation
        groups.",
          "<br>",
          "This experience allows some simulations like checking what would the
        CPI be like without a certain group, or only with selected groups."
        )
      )
    
    sendSweetAlert(
      session = session,
      title = "Simulation - FAQ",
      text = simulation_faq_text,
      type = "question",
      html = TRUE
    )
    
  }