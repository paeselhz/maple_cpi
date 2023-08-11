
timeseries_faq <-
  function(session) {
    
    timeseries_faq_text <-
      HTML(
        paste0(
          "The main objective of this page is to allow the users to view and compare
          data about inflation in different time periods, different groups of items, 
          and different regionalities as well. Since the economy for each province is unique,
          this tab provides a way of exploring through different angles how inflation is
          affecting different sectors and different regions.",
          "<hr>",
          "Also, to allow users to visualize trends in the Consumer Price Index series, 
          there is a button that creates an <strong>Exponential Moving Average</strong>, 
          with the possibility for the user to select different time windows to create this
          metric."
        )
      )
    
    sendSweetAlert(
      session = session,
      title = "Time Series - FAQ",
      text = timeseries_faq_text,
      type = "question",
      html = TRUE
    )
    
  }


group_analysis_faq <-
  function(session) {
    
    group_analysis_faq_text <-
      HTML(
        paste0(
          "The group analysis tab can be interpreted as an exercise of decomposing
          the Canadian inflation into it's eight major groups of items. The proposition
          is a view of the current status of the Canadian inflation, and the share of
          contribution for this inflation given by the basket weights set by Statistics Canada.",
          "<hr>",
          "Also, this view can compare the Year-over-Year decomposition, as well as the 
          Month-over-Month decomposition. Another view is comparing the absolute contributions
          to monthly inflation data, and exploring the share of the inflation that is given
          by a major attribute."
        )
      )
    
    sendSweetAlert(
      session = session,
      title = "Group Analysis - FAQ",
      text = group_analysis_faq_text,
      type = "question",
      html = TRUE
    )
    
  }

interest_rates_faq <-
  function(session) {
    
    interest_rates_faq_text <-
      HTML(
        paste0(
          "This tab displays daily information related to decisions from Bank
          of Canada about the <strong>target interest rate</strong>, the
          <strong>bank rate</strong> and the Canadian Overnight Repo Rate Average,
          known as <strong>CORRA</strong>, which measures the cost of overnight 
          general collateral funding in Canadian dollars using Government of 
          Canada treasury bills and bonds as collateral for repurchase transactions."
        )
      )
    
    sendSweetAlert(
      session = session,
      title = "Interest Rates - FAQ",
      text = interest_rates_faq_text,
      type = "question",
      html = TRUE
    )
    
  }

simulation_faq <-
  function(session) {
    
    simulation_faq_text <-
      HTML(
        paste0(
          "For this tab, the user can create different scenarios related to
        the Canadian Consumer Price Index, most known as CPI. They can create
        customized indexes using one (or more) of the eight major inflation
        groups.",
          "<br><hr>",
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
