.PHONY: coffee clean all

JS_DEPS =  js/jquery-1.8.2.js js/underscore-1.4.2.js

all: lib/js/literallycanvas.fat.js lib/js/literallycanvas.fat.min.js lib/js/literallycanvas.thin.js lib/js/literallycanvas.thin.min.js docs

clean:
	rm -f js/coffee/*.js
	rm -f js/gen/*.js
	rm -f lib/js/literallycanvas.*.js

watch-js:
	watch -n 2 make js/gen/literallycanvas.fat.js

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

js/gen/literallycanvas.fat.js: lib/js/literallycanvas.fat.js
	cp lib/js/literallycanvas.fat.js js/gen/literallycanvas.fat.js

docs:
	python gen_html.py index.jinja2 -o index.html -s trac

serve:
	python -m SimpleHTTPServer 8000 .

update-gh-pages:
	git checkout gh-pages -f
	git merge master -m "Update gh-pages"
	make js/gen/literallycanvas.fat.js
	git commit -am "Update js in gh-pages"
	git push origin gh-pages
	git checkout master -f
