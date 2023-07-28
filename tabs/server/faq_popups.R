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
