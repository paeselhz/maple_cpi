shinyUI(
  fluidPage(
    tags$head(
      tags$link(rel = "shortcut icon", href = "img/maple-leaf.ico"),
      includeHTML('www/ga.html'),
      includeHTML('www/metadata.html'),
      tags$script(
        src = "https://kit.fontawesome.com/c85b63c8cc.js",
        crossorigin = "anonymous"
      )
    ),
    gh_corner("https://github.com/paeselhz/maple_cpi"),
    tags$style(
      "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');"
    ),
    navbarPage(
      title = "Maple CPI",
      theme = "styles.css",
      id = "navbar",
      selected = "home",
      fluid = T,
      home,
      timeseries,
      group_analysis,
      interest_rates,
      about_page
      # cpi_simulation
    )
  )
)