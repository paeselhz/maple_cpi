library(shiny)

shinyServer(function(input, output, session) {
  
  purrr::walk(
    list.files('tabs/server', recursive = T, full.names = T),
    ~source(.x, local = T)
  )
  
})