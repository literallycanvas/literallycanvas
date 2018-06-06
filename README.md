Literally Canvas v0.5.2
=======================

Literally Canvas is an extensible, open source (BSD-licensed), HTML5 drawing
widget. Its only dependency is [React.js](http://facebook.github.io/react/).

Get help on our mailing list by sending an email to
[literallycanvas+subscribe@googlegroups.com](mailto:literallycanvas+subscribe@googlegroups.com)
or by visiting [Google Groups](https://groups.google.com/forum/#!forum/literallycanvas).

### [Full documentation](http://literallycanvas.com)

### [Examples](http://github.com/literallycanvas/literallycanvas-demos)

Along with the CSS, JS, and image assets, this is all it takes:

```javascript
<div class="my-drawing"></div>
<script>
  LC.init(document.getElementsByClassName('my-drawing')[0]);
</script>
```

State of the project
--------------------

No one is maintaining this project. If you report a bug, the ticket will be a
helpful place for discussion, but no one will fix it unless you submit a pull
request. Feature requests will likewise be ignored.

Pull requests will be merged promptly if they are basically OK.

Developing
----------

Setup: `npm install --dev`

Watching and serving: `gulp dev`

Browse to `localhost:8080/demo` and modify `demo/index.html` to test code
in progress.

To generate a production-ready `.js` file, run `gulp` and pull out either
`lib/js/literallycanvas.js` or `lib/js/literallycanvas.min.js`.
