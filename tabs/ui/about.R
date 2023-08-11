about_page <-
  tabPanel(
    title = "About",
    value = "about",
    class = "home-ui-panel",
    hr(),
    h1("About Maple CPI"),
    fluidRow(
      column(
        width = 12,
        class = "about-text-box",
        HTML(
          paste0(
            "<h4>",
            "Thourghout the application, the acronym <strong>YoY</strong> is used 
            to refer to comparisons on a <strong>Year-over-Year</strong> basis, 
            and the acronym <strong>MoM</strong> is used to refer to comparisons
            on a <strong>Month-over-Month</strong> basis.",
            "</h4>",
            "<hr>",
            "<h4>",
            'While not a perfect measure, the <strong>CPI (Consumer Price Index)</strong>
          captures the average shopping experience of Canadians. Each item in the 
          basket is given a "weight," which depends on how much a typical household 
          spends on that item. The basket includes:',
            "<br>",
            "<ul>",
            "<li><strong>Food:</strong> Groceries and restaurant meals,</li>",
            "<li><strong>Shelter:</strong> Rent and mortgage costs, insurance, repairs and maintenance, taxes, utilities,</li>",
            "<li><strong>Transportation:</strong> Vehicles, gasoline, car insurance, repairs and maintenance, public transit costs,</li>",
            "<li><strong>Household expenses:</strong> Phones, internet, child care, cleaning supplies,</li>",
            "<li><strong>Furniture and appliances,</strong></li>",
            "<li><strong>Apparel:</strong> Clothing, footwear, jewellery, dry cleaning,</li>",
            "<li><strong>Medical and personal care:</strong> Prescriptions, dental care, eye care, haircuts, toiletries,</li>",
            "<li><strong>Sports, travel, education and leisure,</strong></li>",
            "<li><strong>Alcohol, tobacco and recreational cannabis</strong></li>",
            "</ul>",
            "</h4>"
          )
        )
      )
    )
  )