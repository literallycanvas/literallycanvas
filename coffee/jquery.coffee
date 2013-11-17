window.LC = window.LC ? {}


slice = Array.prototype.slice


LC._last = (array, n = null) ->
  if n
    return slice.call(array, Math.max(array.length - n, 0))
  else
    return array[array.length - 1]


LC.init = (el, opts = {}) ->
  opts.primaryColor = 'rgba(0, 0, 0, 1)' unless 'primaryColor' of opts
  opts.secondaryColor = 'rgba(0, 0, 0, 0)' unless 'secondaryColor' of opts
  opts.backgroundColor = 'rgb(230, 230, 230)' unless 'backgroundColor' of opts
  opts.imageURLPrefix = 'lib/img' unless 'imageURLPrefix' of opts
  opts.keyboardShortcuts = true unless 'keyboardShortcuts' of opts
  opts.sizeToContainer = true unless 'sizeToContainer' of opts
  opts.watermarkImageURL = null unless 'watermarkImageURL' of opts
  unless 'toolClasses' of opts
    opts.toolClasses = [
        LC.PencilWidget, LC.EraserWidget, LC.LineWidget, LC.RectangleWidget,
        LC.PanWidget, LC.EyeDropperWidget
    ]
  $el = $(el)
  $el.addClass('literally')
  $tbEl = $('<div class="toolbar">')

  $el.append($tbEl)

  lc = new LC.LiterallyCanvas($el.find('canvas').get(0), opts)
  tb = new LC.Toolbar(lc, $tbEl, opts)
  tb.selectTool(tb.tools[0])

  resize = ->
    if opts.sizeToContainer
      lc.$canvas.css('height', "#{$el.height() - $tbEl.height()}px")
    lc.updateSize()

  $el.resize(resize)
  $(window).resize(resize)
  resize()

  [lc, tb]


$.fn.literallycanvas = (opts = {}) ->
  @each (ix, el) =>
    [el.literallycanvas, el.literallycanvasToolbar] = LC.init(el, opts)
  this


$.fn.canvasForExport = ->
  @get(0).literallycanvas.canvasForExport()
