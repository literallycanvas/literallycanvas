{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Line extends ToolWithStroke

  name: 'Line'
  iconName: 'line'

  begin: (x, y, lc) ->
    @currentShape = createShape('Line', {
      x1: x, y1: y, x2: x, y2: y, @strokeWidth,
      color: lc.getColor('primary')})

  continue: (x, y, lc) ->
    @currentShape.x2 = x
    @currentShape.y2 = y
    lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
