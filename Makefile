.PHONY: clean all update-gh-pages lib/js/literallycanvas.js lib/js/literallycanvas.min.js lib/js/literallycanvas.jquery.js lib/js/literallycanvas.jquery.min.js lib/css/literally.css

all: lib/js/literallycanvas.js lib/js/literallycanvas.min.js lib/js/literallycanvas.jquery.js lib/js/literallycanvas.jquery.min.js lib/css/literally.css

livereload:
	livereload . -p 33233

clean:
	rm -f gen/*.js
	rm -f lib/js/literallycanvas*.js

lib/js/literallycanvas.jquery.js:
	uglifyjs gen/core/*.js gen/react/*.js gen/jquery.js \
		-o lib/js/literallycanvas.jquery.js --beautify

lib/js/literallycanvas.jquery.min.js:
	uglifyjs gen/core/*.js gen/react/*.js gen/jquery.js \
		-o lib/js/literallycanvas.jquery.min.js --compress

lib/js/literallycanvas.js:
	uglifyjs gen/core/*.js -o lib/js/literallycanvas.js --beautify

lib/js/literallycanvas.min.js:
	uglifyjs gen/core/*.js -o lib/js/literallycanvas.min.js --compress

serve:
	python -m SimpleHTTPServer 8000 .

release: all
	-rm -rf literallycanvas
	mkdir literallycanvas
	cp -r lib/* literallycanvas/
	cp README_release.txt literallycanvas/README.txt
	cp bower_release.json literallycanvas/bower.json
	ghp-import -p -r lc -b release literallycanvas -m "Release"
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
