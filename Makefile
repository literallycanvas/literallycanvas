watch-coffee:
	coffee -w -o js/coffee -c coffee

coffee:
	coffee -o js/coffee -c coffee

js-dev: coffee
	uglifyjs2 js/coffee/* js/*.js -o js/gen/packed.js

js-prod: coffee
	uglifyjs2 js/coffee/* js/*.js -o js/gen/packed.js --compress

serve:
	python -m SimpleHTTPServer 8000 .


update-gh-pages:
	git checkout gh-pages -f
	git merge master -m "Update gh-pages"
	coffee -o js/gen -c coffee
	git commit -am "Update js in gh-pages"
	git push origin gh-pages
	git checkout master -f
