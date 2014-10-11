Literally Canvas v0.4.1
=======================

Literally Canvas is an extensible, open source (BSD-licensed), HTML5 drawing
widget. Its only dependency is [React.js](http://facebook.github.io/react/).

Get help on our mailing list:
[literallycanvas@librelist.com](literallycanvas@librelist.com) (just send it a
message to subscribe)

### [Full documentation](http://literallycanvas.com)

This is all it takes:

```javascript
<div class="literally with-jquery"></div>
<script>
  $('.literally.with-jquery').literallycanvas();
</script>

<div class="literally without-jquery"></div>
<script>
  LC.init(document.getElementsByClassName('literally without-jquery')[0]);
</script>
```

Developing
----------

Setup: `npm install`

Watching and serving: `gulp dev`

Browse to `localhost:8000/demo` and modify `demo/index.html` to test code
in progress.

To generate a production-ready `.js` file, run `gulp` and pull out either
`lib/js/literallycanvas.js` or `lib/js/literallycanvas.min.js`.