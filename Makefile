.PHONY: coffee clean all update-gh-pages

all: lib/js/literallycanvas.js lib/js/literallycanvas.min.js lib/js/literallycanvas.jquery.js lib/js/literallycanvas.jquery.min.js scss

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

corecoffee: coffee/core/*.coffee
	mkdir -p gen/core
	coffee -o gen/core -c coffee/core

jquerycoffee: coffee/jquery.coffee
	mkdir -p gen
	coffee -o gen -c coffee/jquery.coffee

lib/js/literallycanvas.jquery.js: jquerycoffee corecoffee
	uglifyjs gen/core/*.js gen/jquery.js \
		-o lib/js/literallycanvas.jquery.js --beautify

lib/js/literallycanvas.jquery.min.js: jquerycoffee corecoffee
	uglifyjs gen/core/*.js gen/jquery.js \
		-o lib/js/literallycanvas.jquery.min.js --compress

lib/js/literallycanvas.js: corecoffee
	uglifyjs gen/core/*.js -o lib/js/literallycanvas.js --beautify

lib/js/literallycanvas.min.js: corecoffee
	uglifyjs gen/core/*.js -o lib/js/literallycanvas.min.js --compress

serve:
	python -m SimpleHTTPServer 8000 .

release: all
	-rm -rf literallycanvas
	mkdir literallycanvas
	cp -r lib/* literallycanvas/
	cp README_release.txt literallycanvas/README.txt
	cp bower_release.json literallycanvas/bower.json
	# then you probably want to run
	ghp-import -p -r lc -b release literallycanvas
	git push lc-bower release:master -f

ignore-js:
	git update-index --assume-unchanged lib/js/literallycanvas.js
	git update-index --assume-unchanged lib/js/literallycanvas.min.js
	git update-index --assume-unchanged lib/js/literallycanvas.jquery.js
	git update-index --assume-unchanged lib/js/literallycanvas.jquery.min.js

no-ignore-js:
	git update-index --no-assume-unchanged lib/js/literallycanvas.js
	git update-index --no-assume-unchanged lib/js/literallycanvas.min.js
	git update-index --no-assume-unchanged lib/js/literallycanvas.jquery.js
	git update-index --no-assume-unchanged lib/js/literallycanvas.jquery.min.js
