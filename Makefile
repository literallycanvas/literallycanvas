.PHONY: coffee clean all

JS_DEPS =  js/jquery-1.8.2.js js/underscore-1.4.2.js

all: literallycanvas.fat.js literallycanvas.fat.min.js literallycanvas.thin.js literallycanvas.thin.min.js

clean:
	rm -f js/coffee/*.js
	rm -f js/gen/*.js

watch-js:
	watch -n 2 make js/gen/literallycanvas.fat.js

coffee: coffee/*.coffee
	coffee -o js/coffee -c coffee

literallycanvas.fat.js: coffee
	uglifyjs2 $(JS_DEPS) js/coffee/* -o literallycanvas.fat.js --beautify

literallycanvas.fat.min.js: coffee
	uglifyjs2 $(JS_DEPS) js/coffee/* -o literallycanvas.fat.min.js --compress

literallycanvas.thin.js: coffee
	uglifyjs2 js/coffee/* -o literallycanvas.thin.js --beautify

literallycanvas.thin.min.js: coffee
	uglifyjs2 js/coffee/* -o literallycanvas.thin.min.js --compress

js/gen/literallycanvas.fat.js: literallycanvas.fat.js
	cp literallycanvas.fat.js js/gen/literallycanvas.fat.js

serve:
	python -m SimpleHTTPServer 8000 .


update-gh-pages:
	git checkout gh-pages -f
	git merge master -m "Update gh-pages"
	make js/gen/literallycanvas.fat.js
	git commit -am "Update js in gh-pages"
	git push origin gh-pages
	git checkout master -f
