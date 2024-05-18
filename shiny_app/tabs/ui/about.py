from shiny import ui

about_panel = ui.nav_panel(
    "About",
    ui.hr(),
    ui.h1("About Maple CPI"),
    ui.row(
        ui.column(
            9,
            ui.HTML(
                """<h4>As described by <em>Statistics Canada</em>, the <strong>Consumer 
            Price Index (CPI)</strong> represents changes in prices as 
            experienced by Canadian consumers. It measures price change by 
            comparing, through time, the cost of a fixed basket of goods and services,
            and it is widely used as an indicator of the change in the general 
            level of consumer prices or the rate of inflation. For more detailed
            information, visit
            <a class="about-link" target="_blank" href="https://www23.statcan.gc.ca/imdb/p2SV.pl?Function=getSurvey&SDDS=2301&lang=en&db=imdb&adm=8&dis=2">Statistics Canada</a>.
            </h4>"""
            ),
            ui.HTML(
                """<h4>The target population of the <strong>CPI</strong> consists of families and individuals 
            living in urban and rural private households in Canada, while people 
            living in collective households, such as members of communal colonies, 
            prison inmates, and chronic care patients in hospitals and nursing 
            homes are excluded from the target population.
            </h4>"""
            ),
            ui.hr(),
            ui.HTML(
                """<h4>Thourghout the application, the acronym <strong>YoY</strong> is used 
            to refer to comparisons on a <strong>Year-over-Year</strong> basis, 
            and the acronym <strong>MoM</strong> is used to refer to comparisons
            on a <strong>Month-over-Month</strong> basis.
            </h4>"""
            ),
            ui.hr(),
            ui.HTML(
                """<h4>
            While not a perfect measure, the <strong>CPI</strong>
          captures the average shopping experience of Canadians. The CPI basket weights 
          are normally updated on an annual basis, and the data to derive the weights 
          is obtained primarily from Household Final Consumption Expenditure (HFCE) 
          series, and supplemented by data from the Survey of Household Spending (SHS).
          Each item in the basket is given a "weight," which depends on how much a 
          typical household spends on that item. The basket includes:
            <br>
            <ul>
            <li><strong>Food:</strong> Groceries and restaurant meals,</li>
            <li><strong>Shelter:</strong> Rent and mortgage costs, insurance, repairs and maintenance, taxes, utilities,</li>
            <li><strong>Transportation:</strong> Vehicles, gasoline, car insurance, repairs and maintenance, public transit costs,</li>
            <li><strong>Household expenses:</strong> Phones, internet, child care, cleaning supplies,</li>
            <li><strong>Furniture and appliances,</strong></li>
            <li><strong>Apparel:</strong> Clothing, footwear, jewellery, dry cleaning,</li>
            <li><strong>Medical and personal care:</strong> Prescriptions, dental care, eye care, haircuts, toiletries,</li>
            <li><strong>Sports, travel, education and leisure,</strong></li>
            <li><strong>Alcohol, tobacco and recreational cannabis</strong></li>
            </ul>
            </h4>"""
            ),
            class_ = "about-text-box"
        ),
        ui.column(
            3,
            ui.h3("About the developer"),
            ui.HTML(
                """<div class="image-about">
            <img src="https://avatars.githubusercontent.com/u/25777539?v=4" width = "80%">
          </div>"""
            ),
            ui.HTML(
                """<h4>
          Hi there,
          <br><br>
          I'm a Machine Learning Engineer, and in my free time, I use data analytics
          to explore subjects of my interest, like the state of the economy, immigration
          and general data science projects. Most of my publications can be found on my 
          <a class="about-link" href="https://paeselhz.github.io" target="_blank">blog</a>.
          </h4>"""
            ),
            class_="about-dev-box"
        ),
    ),
    value="about",
)
