.PHONY: all
all: environment code_style run

.PHONY: environment
environment:
	python3 -m venv maple_cpi
	maple_cpi/bin/pip install -r requirements.txt

.PHONY: code_style
code_style:
	maple_cpi/bin/black --exclude '/(venv|env|build|dist|maple_cpi)/' .
	maple_cpi/bin/isort . --skip venv --skip env --skip maple_cpi

.PHONY: data_extraction
data_extraction:
	maple_cpi/bin/python data_extraction/main.py

.PHONY: run
run:
	shiny run shiny_app/app.py

.PHONY: build_shinylive
build_shinylive:
	shinylive export shiny_app docs
	python3 -m http.server --directory docs --bind localhost 8080

.PHONY: clean
clean:
	rm -rf maple_cpi
	find . -name '*.pyc' -delete

.PHONY: clear
clear: clean
	maple_cpi/bin/pip uninstall -y -r requirements.txt