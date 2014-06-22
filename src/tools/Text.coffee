{Tool} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Text extends Tool

  name: 'Text'
  iconName: 'text'

  constructor: (@text = '', @font = 'bold 18px sans-serif') ->

  setText:(text) ->
    @text = text

  begin:(x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = createShape('Text', {x, y, @text, @color, @font})

  continue:(x, y, lc) ->
    @currentShape.x = x
    @currentShape.y = y
    lc.drawShapeInProgress(@currentShape)

  end:(x, y, lc) ->
    lc.saveShape(@currentShape)

  optionsStyle: 'font'
