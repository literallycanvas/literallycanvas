.PHONY: coffee clean all update-gh-pages

all: lib/js/literallycanvas.js lib/js/literallycanvas.min.js

livereload:
	livereload . -p 33233

clean:
	rm -f gen/*.js
	rm -f lib/js/literallycanvas.*.js

watch-js:
	watch -n 2 make lib/js/literallycanvas.js

watch-css:
	sass --watch scss/literally.scss:lib/css/literally.css

scss:
	sass scss/literally.scss:lib/css/literally.css

coffee: coffee/*.coffee
	mkdir -p gen
	coffee -o gen -c coffee

lib/js/literallycanvas.js: coffee
	uglifyjs2 gen/*.js -o lib/js/literallycanvas.js --beautify

lib/js/literallycanvas.min.js: coffee
	uglifyjs2 gen/*.js -o lib/js/literallycanvas.min.js --compress

serve:
	python -m SimpleHTTPServer 8000 .

release: all
	-rm -rf literallycanvas
	mkdir literallycanvas
	cp -r lib/* literallycanvas/
	cp README_release.txt literallycanvas/README.txt
	tar -cvzf literallycanvas.tar.gz literallycanvas
	rm -rf literallycanvas
