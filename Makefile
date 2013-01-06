.PHONY: coffee clean all update-gh-pages

all: lib/js/literallycanvas.js lib/js/literallycanvas.min.js

clean:
	rm -f gen/*.js
	rm -f lib/js/literallycanvas.*.js

watch-js:
	watch -n 2 make lib/js/literallycanvas.js

coffee: coffee/*.coffee
	mkdir -p gen/coffee_out
	coffee -o gen/coffee_out -c coffee

lib/js/literallycanvas.js: coffee
	uglifyjs2 gen/coffee_out/* -o lib/js/literallycanvas.js --beautify

lib/js/literallycanvas.min.js: coffee
	uglifyjs2 gen/coffee_out/* -o lib/js/literallycanvas.min.js --compress

serve:
	python -m SimpleHTTPServer 8000 .
