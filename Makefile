watch-coffee:
	coffee -w -o js/gen -c coffee

serve:
	python -m SimpleHTTPServer 8000 .


update-gh-pages:
	git checkout gh-pages -f
	git merge master -m "Update gh-pages"
	git push origin gh-pages
	git checkout master -f
