library(sf)
library(DBI)
library(RPostgres)
library(dplyr)
library(shiny)
library(leaflet)
library(lubridate)
library(highcharter)
library(shinyWidgets)
library(shinycssloaders)

## importing support functions ----

source('functions/utils.R')
source('functions/highchart_cpi.R')
source('functions/timeseries_main.R')
source('functions/sweet_alert_faqs.R')
source('functions/calculate_mom_yoy.R')
source('functions/utils_bank_of_canada.R')

## creating lists used by app ----

geographical_locations <-
  c(
    "Canada",
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan"
  )

major_groups <-
  c(
    "All-items",
    "Food",
    "Shelter",
    "Household operations, furnishings and equipment",
    "Clothing and footwear",
    "Transportation",
    "Health and personal care",
    "Recreation, education and reading",
    "Alcoholic beverages, tobacco products and recreational cannabis"
  )

icon_groups <-
  c(
    "fa-solid fa-asterisk",
    "fa-solid fa-utensils",
    "fa-solid fa-house",
    "fa-solid fa-wrench",
    "fa-solid fa-shirt",
    "fa-solid fa-plane",
    "fa-solid fa-heart",
    "fa-solid fa-book",
    "fa-solid fa-martini-glass"
  )

## loading data ----

postgres_con <-
  DBI::dbConnect(
    RPostgres::Postgres(),
    dbname = Sys.getenv("POSTGRES_DB"),
    host = Sys.getenv("POSTGRES_HOST"),
    port = 5432,
    user = Sys.getenv("POSTGRES_USER"),
    password = Sys.getenv("POSTGRES_PASSWORD"),
    sslmode = "require"
  )

boc_rates <-
  tbl(postgres_con, dbplyr::in_schema("maple_cpi", "boc_rates")) %>% 
  rename(
    date = ref_date
  ) %>% 
  collect() %>% 
  mutate(
    date = as.Date(date)
  )
  # readr::read_rds(
  #   'data/boc_rates.rds'
  # )

cpi <-
  tbl(postgres_con, dbplyr::in_schema("maple_cpi", "cpi")) %>% 
  filter(
    ref_date >= "2001-01-01"
  ) %>% 
  collect() %>% 
  mutate(
    ref_date = as.Date(ref_date)
  )
  # readr::read_rds(
  #   'data/cpi_transformed.rds'
  # ) %>% 
  # filter(
  #   ref_date >= as.Date("2001-01-01")
  # )

basket_weights <-
  readr::read_rds(
    'data/basket_weights.rds'
  ) %>% 
  filter(
    price_period_of_weight == "Weight at basket reference period prices"
  ) %>% 
  select(
    ref_date,
    geo,
    products_and_product_groups,
    basket_weights = value
  ) %>% 
  left_join(
    readr::read_rds(
      'data/basket_weights_timewindow.rds'
    ),
    by = 'ref_date'
  ) %>% 
  filter(!is.na(start_month))

map_provinces <-
  readr::read_rds('data/map_provinces.rds') %>% 
  filter(
    PRENAME %in% geographical_locations
  )
  # sf::st_transform(crs = 4702)

## new data -- government bonds ----

gvt_bonds <-
  readr::read_csv(
    "https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/csv",
    skip = 27
  ) %>% 
  janitor::clean_names()

## general app config ----

cards_color <-
  "#E87D6B"

## loading ui files ----

purrr::walk(
  list.files('tabs/ui', recursive = T, full.names = T),
  source
)
