Literally Canvas v0.4
=====================

Full documentation can be found at literallycanvas.com.

Literally Canvas depends on React.js (tested on 0.10).

1. Add the files under `css/` and `img/` to your project, as well as the
appropriate file from `js/`.

2. Add some markup and some JavaScript:

<div class="literally"></div>

<script type="text/javascript">
  // the only LC-specific thing we have to do
  LC.init(
    document.getElementsByClassName('literally')[0],
    {imageURLPrefix: '/path/to/img'})

  // you may want to disable scrolling on touch devices
  $(document).bind('touchmove', function(e) {
    if (e.target === document.documentElement) {
      return e.preventDefault();
    }
  });
</script>
