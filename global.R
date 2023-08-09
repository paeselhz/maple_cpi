library(sf)
library(dplyr)
library(shiny)
library(leaflet)
library(lubridate)
library(highcharter)
library(shinyWidgets)
library(shinycssloaders)

source('functions/utils.R')
source('functions/highchart_cpi.R')
source('functions/timeseries_main.R')
source('functions/sweet_alert_faqs.R')
source('functions/calculate_mom_yoy.R')

boc_rates <-
  readr::read_rds(
    'data/boc_rates.rds'
  )

cpi <-
  readr::read_rds(
    'data/cpi_transformed.rds'
  ) %>% 
  filter(
    ref_date >= as.Date("2001-01-01")
  )

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
    "glyphicon-asterisk",
    "glyphicon-cutlery",
    "glyphicon-home",
    "glyphicon-wrench",
    "glyphicon-sunglasses",
    "glyphicon-plane",
    "glyphicon-heart",
    "glyphicon-book",
    "glyphicon-glass"
  )

map_provinces <-
  readr::read_rds('data/map_provinces.rds') %>% 
  filter(
    PRENAME %in% geographical_locations
  ) %>% 
  sf::st_transform(crs = 4702)

purrr::walk(
  list.files('tabs/ui', recursive = T, full.names = T),
  source
)
