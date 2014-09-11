LiterallyCanvas = require './core/LiterallyCanvas'
initReact = require './reactGUI/init'

shapes = require './core/shapes'
util = require './core/util'

{localize} = require './core/localization'


require './optionsStyles/font'
require './optionsStyles/stroke-width'
require './optionsStyles/line-options-and-stroke-width'
require './optionsStyles/null'
{defineOptionsStyle} = require './optionsStyles/optionsStyles'


baseTools = require './tools/base'
tools =
  Pencil: require './tools/Pencil'
  Eraser: require './tools/Eraser'
  Line: require './tools/Line'
  Rectangle: require './tools/Rectangle'
  Ellipse: require './tools/Ellipse'
  Text: require './tools/Text'
  Pan: require './tools/Pan'
  Eyedropper: require './tools/Eyedropper'

  Tool: baseTools.Tool
  ToolWithStroke: baseTools.ToolWithStroke


defaultImageURLPrefix = 'lib/img'
setDefaultImageURLPrefix = (newDefault) -> defaultImageURLPrefix = newDefault


init = (el, opts = {}) ->
  opts.imageURLPrefix ?= defaultImageURLPrefix

  opts.primaryColor ?= '#000'
  opts.secondaryColor ?= '#fff'
  opts.backgroundColor ?= 'transparent'

  opts.keyboardShortcuts ?= true

  opts.imageSize ?= {width: 'infinite', height: 'infinite'}

  opts.backgroundShapes ?= []
  opts.watermarkImage ?= null
  opts.watermarkScale ?= 1

  unless 'tools' of opts
    opts.tools = [
      tools.Pencil,
      tools.Eraser,
      tools.Line,
      tools.Rectangle,
      tools.Ellipse,
      tools.Text,
      tools.Pan,
      tools.Eyedropper,
    ]

  ### henceforth, all pre-existing DOM children shall be destroyed ###

  for child in el.children
    el.removeChild(child)

  ### and now we rebuild the city ###

  if [' ', ' '].join(el.className).indexOf(' literally ') == -1
    el.className = el.className + ' literally'

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'

  drawingViewElement = document.createElement('div')
  drawingViewElement.className = 'lc-drawing'

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'

  el.appendChild(pickerElement)
  el.appendChild(drawingViewElement)
  el.appendChild(optionsElement)

  ### and get to work ###

  lc = new LiterallyCanvas(drawingViewElement, opts)

  initReact(pickerElement, optionsElement, lc, opts.tools, opts.imageURLPrefix)

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
  setDefaultImageURLPrefix,

  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,

  localize: localize
}
