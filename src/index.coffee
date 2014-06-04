LiterallyCanvas = require './core/LiterallyCanvas'
initReact = require './reactGUI/init'

shapes = require './core/shapes'
util = require './core/util'


require './optionsStyles/font'
require './optionsStyles/stroke-width'
require './optionsStyles/null'
{defineOptionsStyle} = require './optionsStyles/optionsStyles'


baseTools = require './tools/base'
tools =
  Pencil: require './tools/Pencil'
  Eraser: require './tools/Eraser'
  Line: require './tools/Line'
  Rectangle: require './tools/Rectangle'
  Text: require './tools/Text'
  Pan: require './tools/Pan'
  Eyedropper: require './tools/Eyedropper'

  Tool: baseTools.Tool
  ToolWithStroke: baseTools.ToolWithStroke


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
      tools.Pencil,
      tools.Eraser,
      tools.Line,
      tools.Rectangle,
      tools.Text,
      tools.Pan,
      tools.Eyedropper,
    ]

  if [' ', ' '].join(el.className).indexOf(' literally ') == -1
    el.className = el.className + ' literally'

  unless el.getElementsByTagName('canvas').length
    el.appendChild(document.createElement('canvas'))
  lc = new LiterallyCanvas(el.getElementsByTagName('canvas')[0], opts)
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
if window.$
    registerJQueryPlugin(window.$)


module.exports = {
  init, registerJQueryPlugin, util, tools, defineOptionsStyle,

  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,
}
