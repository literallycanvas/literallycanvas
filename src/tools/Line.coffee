{Tool} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Line extends Tool

  name: 'Line'
  iconName: 'line'

  constructor: -> @strokeWidth = 5
  optionsStyle: 'line-options-and-stroke-width'

  begin: (x, y, lc) ->
    @currentShape = createShape('Line', {
      x1: x, y1: y, x2: x, y2: y, @strokeWidth,
      dash: switch
        when @isDashed then [@strokeWidth * 2, @strokeWidth * 4]
        else null
      endCapShapes: if @hasEndArrow then [null, 'arrow'] else null
      color: lc.getColor('primary')})

  continue: (x, y, lc) ->
    @currentShape.x2 = x
    @currentShape.y2 = y
    lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
