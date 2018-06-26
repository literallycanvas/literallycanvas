{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Rectangle extends ToolWithStroke

  name: 'Rectangle'
  iconName: 'rectangle'

  begin: (x, y, lc) ->
    @currentShape = createShape('Rectangle', {
      x, y, @strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')})

  continue: (x, y, lc) ->
    @currentShape.width = x - @currentShape.x
    @currentShape.height = y - @currentShape.y
    lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    # If there is no height or width, dont save
    if @currentShape.height == 0 or @currentShape.width == 0
      return
    lc.saveShape(@currentShape)
