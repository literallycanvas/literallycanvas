slice = Array.prototype.slice

module.exports =
  last: (array, n = null) ->
    if n
      return slice.call(array, Math.max(array.length - n, 0))
    else
      return array[array.length - 1]

  sizeToContainer: (canvas, callback = ->) ->
    container = canvas.parentElement
    resize = =>
      canvas.style.width = "#{container.offsetWidth}px"
      canvas.style.height = "#{container.offsetHeight}px"
      canvas.setAttribute('width', canvas.offsetWidth)
      canvas.setAttribute('height', canvas.offsetHeight)
      callback()

    container.addEventListener 'resize', resize
    window.addEventListener 'resize', resize
    window.addEventListener 'orientationchange', resize
    resize()

  combineCanvases: (a, b) ->
    c = document.getElementsByTagName('canvas')[0]
    c.width = Math.max(a.width, b.width)
    c.height = Math.max(a.height, b.height)
    ctx = c.getContext('2d')
    ctx.drawImage(a, 0, 0)
    ctx.drawImage(b, 0, 0)
    c
