window.LC = window.LC ? {}


slice = Array.prototype.slice


LC._last = (array, n = null) ->
  if n
    return slice.call(array, Math.max(array.length - n, 0))
  else
    return array[array.length - 1]


LC.init = (el, opts = {}) ->
  opts.primaryColor ?= '#000'
  opts.secondaryColor ?= '#fff'
  opts.backgroundColor ?= 'transparent'
  opts.imageURLPrefix ?= 'lib/img'
  opts.keyboardShortcuts ?= true
  opts.preserveCanvasContents ?= false
  opts.sizeToContainer ?= true
  opts.backgroundShapes ?= []
  opts.watermarkImage ?= null
  unless 'toolClasses' of opts
    opts.toolClasses = [
        LC.PencilWidget, LC.EraserWidget, LC.LineWidget, LC.RectangleWidget,
        LC.PanWidget, LC.EyeDropperWidget, LC.TextWidget
    ]

  $el = $(el)
  $el.addClass('literally')
  $tbEl = $('<div class="toolbar">')

  $el.append($tbEl)

  unless $el.find('canvas').length
    $el.append('<canvas>')
  lc = new LC.LiterallyCanvas($el.find('canvas').get(0), opts)
  tb = new LC.Toolbar(lc, $tbEl, opts)
  tb.selectTool(tb.tools[0])

  resize = ->
    if opts.sizeToContainer
      lc.$canvas.css('height', "#{$el.height() - $tbEl.height()}px")
    lc.updateSize()

  $el.resize(resize)
  $(window).bind('orientationchange resize', resize)
  resize()

  if 'onInit' of opts
    opts.onInit(lc)

  [lc, tb]


$.fn.literallycanvas = (opts = {}) ->
  @each (ix, el) =>
    [el.literallycanvas, el.literallycanvasToolbar] = LC.init(el, opts)
  this
