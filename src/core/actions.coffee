# maybe add checks to these in the future to make sure you never double-undo or
# double-redo
class ClearAction

  constructor: (@lc, @oldShapes, @newShapes) ->

  do: ->
    @lc.shapes = @newShapes
    @lc.repaint()

  undo: ->
    @lc.shapes = @oldShapes
    @lc.repaint()


class AddShapeAction

  constructor: (@lc, @shape) ->

  do: ->
    @ix = @lc.shapes.length
    @lc.shapes.push(@shape)
    @lc.repaint()

  undo: ->
    @lc.shapes.pop(@ix)
    @lc.repaint()


module.exports = {ClearAction, AddShapeAction}