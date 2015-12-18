Literally Canvas v0.4.11
========================

Literally Canvas is an extensible, open source (BSD-licensed), HTML5 drawing
widget. Its only dependency is [React.js](http://facebook.github.io/react/).

Get help on our mailing list:
[mailto:literallycanvas@librelist.com](literallycanvas@librelist.com) (just
send it a message to subscribe)

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

State of the Project
--------------------

I, Steve, am the only major contributor to this project. I don't currently
use it for anything, so it isn't high on my list of things to work on. As
such, major bugs may go unfixed for unacceptable amounts of time if you
assume I'll take care of them.

If you are truly in need of a bug-free, feature-rich HTML5 drawing widget, it
is in your best interest to get up to date on the source code and start
sending pull requests. I'm more than happy to help you learn.

I started this project entirely for fun. People have come to rely on it, but
there hasn't been a corresponding increase in contributions. At this point I
can't keep supporting people's products for free.

That said, I'm available to work as a contractor to add features to the
library. My email address is in the commits. You can also put bounties on
issues at
[Bountysource](https://www.bountysource.com/teams/literallycanvas/issues).

Developing
----------

Setup: `npm install`

Watching and serving: `gulp dev`

Browse to `localhost:8000/demo` and modify `demo/index.html` to test code
in progress.

To generate a production-ready `.js` file, run `gulp` and pull out either
`lib/js/literallycanvas.js` or `lib/js/literallycanvas.min.js`.
