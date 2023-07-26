library(dplyr)

boc_rates <-
  readr::read_csv(
    'data/raw/10100139-eng/10100139.csv'
  ) %>% 
  janitor::clean_names() %>% 
  filter(
    financial_market_statistics %in% c(
      "Overnight money market financing",
      "Bank rate",
      "Target rate"
    ),
    !is.na(value),
    ref_date >= as.Date("2002-01-01")
  ) %>% 
  mutate(
    financial_market_statistics = case_when(
      financial_market_statistics == "Overnight money market financing" ~ "corra",
      financial_market_statistics == "Bank rate" ~ "bank_rate",
      financial_market_statistics == "Target rate" ~ "overnight_target",
      TRUE ~ ""
    )
  ) %>% 
  select(
    date = ref_date,
    financial_market_statistics,
    value
  ) %>% 
  tidyr::pivot_wider(
    names_from = financial_market_statistics,
    values_from = value
  )

readr::write_rds(
  boc_rates, 'data/boc_rates.rds'
)

cpi <-
  readr::read_csv(
    'data/raw/18100004-eng/18100004.csv'
  ) %>% 
  janitor::clean_names() %>% 
  filter(
    geo %in% geographical_locations,
    products_and_product_groups %in% major_groups
  ) %>% 
  mutate(
    ref_date = as.Date(paste0(ref_date, "-01")),
  ) %>% 
  select(
    ref_date,
    geo,
    products_and_product_groups,
    value
  )

readr::write_rds(
  cpi, 'data/cpi_transformed.rds'
)
