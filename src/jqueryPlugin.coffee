$ = require 'jquery'


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
  lc = new LC.LiterallyCanvas($el.find('canvas').get(0), opts)
  LC.React.init(el, lc, opts.tools, opts.imageURLPrefix)

  if 'onInit' of opts
    opts.onInit(lc)

  lc


initJQueryPlugin = ->
  $.fn.literallycanvas = (opts = {}) ->
    @each (ix, el) =>
      el.literallycanvas = LC.init(el, opts)
    this


module.exports = {init, initJQueryPlugin}