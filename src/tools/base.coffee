tools = {}

tools.Tool = class Tool

  # for debugging
  name: null

  # {imageURLPrefix}/{iconName}.png
  iconName: null

  usesSimpleAPI: true

  # called when the user starts dragging
  begin: (x, y, lc) ->

  # called when the user moves while dragging
  continue: (x, y, lc) ->

  # called when the user finishes dragging
  end: (x, y, lc) ->

  # kind of options GUI to display
  optionsStyle: null

  didBecomeActive: (lc) ->
  willBecomeInactive: (lc) ->


tools.ToolWithStroke = class ToolWithStroke extends Tool

  constructor: (lc) -> @strokeWidth = lc.opts.defaultStrokeWidth
  optionsStyle: 'stroke-width'


module.exports = tools