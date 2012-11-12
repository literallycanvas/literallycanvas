JS_FILES =  js/jquery-1.8.2.js js/underscore-1.4.2.js js/backbone-0.9.2.js js/bootstrap-just-popovers.js

watch-js:
	watch -n 2 make js-dev

coffee:
	coffee -o js/coffee -c coffee

js-dev: coffee
	uglifyjs2 $(JS_FILES) js/coffee/* -o js/gen/packed.js --beautify

js-prod: coffee
	uglifyjs2 $(JS_FILES) js/coffee/* -o js/gen/packed.js --compress

serve:
	python -m SimpleHTTPServer 8000 .


update-gh-pages:
	git checkout gh-pages -f
	git merge master -m "Update gh-pages"
	make js-prod
	git commit -am "Update js in gh-pages"
	git push origin gh-pages
	git checkout master -f
