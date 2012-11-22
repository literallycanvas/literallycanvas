.PHONY: coffee clean all update-gh-pages

JS_DEPS =  js/jquery-1.8.2.js js/underscore-1.4.2.js

all: lib/js/literallycanvas.fat.js lib/js/literallycanvas.fat.min.js lib/js/literallycanvas.thin.js lib/js/literallycanvas.thin.min.js

clean:
	rm -f js/coffee/*.js
	rm -f js/gen/*.js
	rm -f lib/js/literallycanvas.*.js

watch-js:
	watch -n 2 make lib/js/literallycanvas.fat.js

coffee: coffee/*.coffee
	coffee -o js/coffee -c coffee

lib/js/literallycanvas.fat.js: coffee
	uglifyjs2 $(JS_DEPS) js/coffee/* -o lib/js/literallycanvas.fat.js --beautify

lib/js/literallycanvas.fat.min.js: coffee
	uglifyjs2 $(JS_DEPS) js/coffee/* -o lib/js/literallycanvas.fat.min.js --compress

lib/js/literallycanvas.thin.js: coffee
	uglifyjs2 js/coffee/* -o lib/js/literallycanvas.thin.js --beautify

lib/js/literallycanvas.thin.min.js: coffee
	uglifyjs2 js/coffee/* -o lib/js/literallycanvas.thin.min.js --compress

serve:
	python -m SimpleHTTPServer 8000 .
