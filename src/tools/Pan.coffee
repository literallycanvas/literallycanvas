{Tool} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Pan extends Tool

  name: 'Pan'
  iconName: 'pan'
  usesSimpleAPI: false

  didBecomeActive: (lc) ->
    unsubscribeFuncs = []
    @unsubscribe = =>
      for func in unsubscribeFuncs
        func()

    unsubscribeFuncs.push lc.on 'pointerdown', ({x, y}) =>
      @oldPosition = lc.position
      @pointerStart = {x, y}

    unsubscribeFuncs.push lc.on 'pointerdrag', ({x, y}) =>
      dp = {
        x: (x - @pointerStart.x),
        y: (y - @pointerStart.y)
      }
      lc.setPan(@oldPosition.x + dp.x, @oldPosition.y + dp.y)

  willBecomeInactive: (lc) ->
    @unsubscribe()
