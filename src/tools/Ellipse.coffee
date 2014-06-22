{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'


# this is pretty similar to the Rectangle tool. maybe consolidate somehow.
module.exports = class Ellipse extends ToolWithStroke

  name: 'Ellipse'
  iconName: 'ellipse'

  begin: (x, y, lc) ->
    @currentShape = createShape('Ellipse', {
      x, y, @strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')})

  continue: (x, y, lc) ->
    @currentShape.width = x - @currentShape.x
    @currentShape.height = y - @currentShape.y
    lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
