Literally Canvas
================

![Screenshot](http://steveasleep.com/literallycanvas/img/screenshot.png)

Usage
-----

Literally Canvas depends on jQuery (tested on 1.8.2) and underscore.js (tested
on 1.4.2). The "fat" version includes these dependencies. The "thin" version
does not. The minified thin version is ~26k and should shrink significantly
when we remove the stupid color picker dependency.

Add the files under `lib/css` and `lib/img` to your project, as well as the
appropriate file from `lib/js`. Then do this:

```html
<div class="literally"><canvas></canvas></div>
```

```javascript
$('.literally').literallycanvas();
```

The end!

Although you may also want to do something like this to prevent scrolling on
touch devices:

```javascript
$(document).bind('touchmove', function(e) {
  if (e.target === document.documentElement) {
    return e.preventDefault();
  }
});
```

You can also pass in the background color, a set of tools to use, and whether
to enable keyboard shortcuts:

```javascript
$('.literally').literallycanvas({
  backgroundColor: 'rgb(255, 0, 0)',  // default rgb(230, 230, 230)
  keyboardShortcuts: false,           // default true
  toolClasses: [LC.Pencil]
});
```

Files
-----

```
coffee/       Coffeescript source code
css/          Documentation CSS
js/           Javascript dependencies and temporary Javascript files
lib/          Things you need to use Literally Canvas on your page
LICENSE       The license. Spoiler: it's BSD!
example.html  A very simple example of how to use Literally Canvas
index.html    Documentation home page
README.md     You are here
watch_js.sh   Simple watch script for people who don't have make (...)
```

Developing
----------

To build the docs, you need Python 2.7, `jinja2`, and `pygments`. Read the
`Makefile`.
