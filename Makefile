.PHONY: clean all update-gh-pages gulp release-all release-files release-branch

all: gulp

gulp:
	gulp

clean:
	rm -f lib/js/literallycanvas*.js

serve:
	gulp serve

release-files: all
	-rm -rf literallycanvas
	mkdir literallycanvas
	cp -r lib/* literallycanvas/
	cp README_release.txt literallycanvas/README.txt
	cp bower_release.json literallycanvas/bower.json

release-branch: release-files
	git fetch lc release:release
	git push origin lc/release:release
	ghp-import -p -r lc -b release literallycanvas -m "Release"

release-bower:
	git push lc-bower release:master -f
	git push lc-bower --tags

release-npm:
	npm publish

ignore-js:
	git update-index --assume-unchanged lib/js/literallycanvas.js
	git update-index --assume-unchanged lib/js/literallycanvas.min.js

no-ignore-js:
	git update-index --no-assume-unchanged lib/js/literallycanvas.js
	git update-index --no-assume-unchanged lib/js/literallycanvas.min.js
