FROM rocker/shiny:4.3.0

WORKDIR /srv/shiny-server/

COPY . /srv/shiny-server/

COPY templates/shiny-server.conf /etc/shiny-server/shiny-server.conf

RUN apt-get update \
  && apt-get install -y \
      libglpk-dev \
      libudunits2-dev \
      libproj-dev \
      libgdal-dev \
  && install2.r renv

RUN R -e "renv::restore()"

RUN chmod -R 777 /srv/shiny-server/
