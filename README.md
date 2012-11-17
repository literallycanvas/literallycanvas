Literally Canvas
================

![Screenshot](raw/master/img/screenshot.png)

```
coffee/       Coffeescript source code
css/          Documentation CSS
js/           Javascript dependencies and temporary Javascript files
lib/          Things you need to use Literally Canvas on your page
example.html  A very simple example of how to use Literally Canvas
index.html    Documentation home page
README.md     You are here
watch_js.sh   Simple watch script for people who don't have make (...)
```

Usage
-----

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
