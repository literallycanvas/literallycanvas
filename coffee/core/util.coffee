window.LC = window.LC ? {}


slice = Array.prototype.slice

LC.util =
  last: (array, n = null) ->
    if n
      return slice.call(array, Math.max(array.length - n, 0))
    else
      return array[array.length - 1]

  sizeToContainer: (canvas, callback = ->) ->
    $canvas = $(canvas)
    $container = $canvas.parent()
    resize = =>
      canvas.style.width = "#{$container.width()}px"
      canvas.style.height = "#{$container.height()}px"
      canvas.setAttribute('width', $canvas.width())
      canvas.setAttribute('height', $canvas.height())
      callback()

    $container.resize(resize)
    $(window).bind('orientationchange resize', resize)
    resize()

  combineCanvases: (a, b) ->
    c = $('<canvas>').get(0)
    c.width = Math.max(a.width, b.width)
    c.height = Math.max(a.height, b.height)
    ctx = c.getContext('2d')
    ctx.drawImage(a, 0, 0)
    ctx.drawImage(b, 0, 0)
    c
