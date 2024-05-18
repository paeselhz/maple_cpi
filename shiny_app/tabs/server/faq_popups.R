
observeEvent(
  input$show_timeseries_faq, 
  {
    
    timeseries_faq(session)
    
  })

observeEvent(
  input$show_group_analysis_faq, 
  {
    
    group_analysis_faq(session)
    
  })

observeEvent(
  input$show_interest_rates_faq, 
  {
    
    interest_rates_faq(session)
    
  })

observeEvent(
  input$navbar,
  {
    
    if(input$navbar == "simulation"){
      
      simulation_faq(session)
      
    }
  })

observeEvent(
  input$show_simulation_faq, 
  {
    
    simulation_faq(session)
    
  })

