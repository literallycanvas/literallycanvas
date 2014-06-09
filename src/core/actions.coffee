# maybe add checks to these in the future to make sure you never double-undo or
# double-redo
class ClearAction

  constructor: (@lc, @oldShapes, @newShapes) ->

  do: ->
    @lc.shapes = @newShapes
    @lc.repaintLayer('main')

  undo: ->
    @lc.shapes = @oldShapes
    @lc.repaintLaye('main')


class AddShapeAction

  constructor: (@lc, @shape) ->

  do: ->
    @ix = @lc.shapes.length
    @lc.shapes.push(@shape)
    @lc.repaintLayer('main')

  undo: ->
    @lc.shapes.pop(@ix)
    @lc.repaintLayer('main')


module.exports = {ClearAction, AddShapeAction}