window.LC = window.LC ? {}


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
        LC.TextWidget, LC.PanWidget, LC.EyeDropperWidget,
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

  if 'onInit' of opts
    opts.onInit(lc)

  [lc, tb]


$.fn.literallycanvas = (opts = {}) ->
  @each (ix, el) =>
    [el.literallycanvas, el.literallycanvasToolbar] = LC.init(el, opts)
  this
