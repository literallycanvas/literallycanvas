watch-coffee:
	coffee -w -o js/gen -c coffee

serve:
	python -m SimpleHTTPServer 8000 .
