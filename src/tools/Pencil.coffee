{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'

module.exports = class Pencil extends ToolWithStroke

  name: 'Pencil'
  iconName: 'pencil'

  begin: (x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = @makeShape()
    @currentShape.addPoint(@makePoint(x, y, lc))

  continue: (x, y, lc) ->
    @currentShape.addPoint(@makePoint(x, y, lc))
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) ->
    createShape('Point', {x, y, size: @strokeWidth, @color})
  makeShape: -> createShape('LinePath')
