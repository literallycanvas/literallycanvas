Literally Canvas
================

Usage
-----

[Full documentation](http://literallycanvas.github.com)

Literally Canvas depends on jQuery (tested on 1.8.2) and underscore.js (tested
on 1.4.2). The "fat" version includes these dependencies. The "thin" version
does not.

Add the files under `lib/css` and `lib/img` to your project, as well as the
appropriate file from `lib/js`. Then do this:

```html
<div class="literally"><canvas></canvas></div>
```

```javascript
$('.literally').literallycanvas();
```

For options and other information, see the [full
documentation](http://literallycanvas.github.com).

The color picker is derived from (but not identical to) [this one by Stefan
Petre](http://www.eyecon.ro/bootstrap-colorpicker/). We intend to replace it in
the next version.

Files
-----

```
coffee/       Coffeescript source code
js/           Javascript dependencies and temporary Javascript files
lib/          Things you need to use Literally Canvas on your page
LICENSE       The license. Spoiler: it's BSD!
README.md     You are here
watch_js.sh   Simple watch script for people who don't have make (...)
```

Developing
----------

You'll need `coffee-script` and `uglify-js2` installed via `npm`.
