$ = window.$
LiterallyCanvas = require './core/LiterallyCanvas'
initReact = require './reactGUI/init'


init = (el, opts = {}) ->
  opts.primaryColor ?= '#000'
  opts.secondaryColor ?= '#fff'
  opts.backgroundColor ?= 'transparent'
  opts.imageURLPrefix ?= 'lib/img'
  opts.keyboardShortcuts ?= true
  opts.preserveCanvasContents ?= false
  opts.sizeToContainer ?= true
  opts.backgroundShapes ?= []
  opts.watermarkImage ?= null
  unless 'tools' of opts
    opts.tools = [
      'Pencil',
      'Eraser',
      'Line',
      'Rectangle',
      'Text',
      'Pan',
      'Eyedropper',
    ]

  $el = $(el)
  $el.addClass('literally')

  unless $el.find('canvas').length
    $el.append('<canvas>')
  lc = new LiterallyCanvas($el.find('canvas').get(0), opts)
  initReact(el, lc, opts.tools, opts.imageURLPrefix)

  if 'onInit' of opts
    opts.onInit(lc)

  lc


registerJQueryPlugin = (_$) ->
  _$.fn.literallycanvas = (opts = {}) ->
    @each (ix, el) =>
      el.literallycanvas = init(el, opts)
    this


# non-browserify compatibility
window.LC = {init}
registerJQueryPlugin($)


module.exports = {init, registerJQueryPlugin}