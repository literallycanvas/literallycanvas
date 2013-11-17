Literally Canvas
================

Literally Canvas is an extensible, open source (BSD-licensed), HTML5 drawing
widget that currently supports a minimal set of drawing operations. You can
draw, erase, set the color with the eyedropper, undo, redo, pan, and zoom. It
depends on jQuery.

Get help on our mailing list:
[literallycanvas@librelist.com](literallycanvas@librelist.com) (just send it a
message to subscribe)

Usage
-----

[Full documentation](http://literallycanvas.github.com)

Literally Canvas depends on jQuery (tested on 1.8.2).

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
```

Developing
----------

You'll need `coffee-script` and `uglify-js2` installed via `npm`, and `sass`
via `gem`. Build with `make`.

If you `pip install livereload`, you can `make livereload` and open
`http://localhost:33233/demo` in your browser to get a live-updated demo.
