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

    unsubscribeFuncs.push lc.on 'pointerdown', ({rawX, rawY}) =>
      @oldPosition = lc.position
      @pointerStart = {x: rawX, y: rawY}

    unsubscribeFuncs.push lc.on 'pointerdrag', ({rawX, rawY}) =>
      dp = {
        x: (rawX - @pointerStart.x),
        y: (rawY - @pointerStart.y)
      }
      lc.setPan(@oldPosition.x + dp.x, @oldPosition.y + dp.y)

  willBecomeInactive: (lc) ->
    @unsubscribe()
