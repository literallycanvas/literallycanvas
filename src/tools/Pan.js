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

    unsubscribeFuncs.push lc.on 'lc-pointerdown', ({rawX, rawY}) =>
      @oldPosition = lc.position
      @pointerStart = {x: rawX, y: rawY}

    unsubscribeFuncs.push lc.on 'lc-pointerdrag', ({rawX, rawY}) =>
      # okay, so this is really bad:
      # lc.position is "buggy screen coordinates": correct on non-retina,
      # probably wrong on retina. compensate here; in v0.5 we should put the
      # offset in drawing coordinates.
      dp = {
        x: (rawX - @pointerStart.x) * lc.backingScale,
        y: (rawY - @pointerStart.y) * lc.backingScale
      }
      lc.setPan(@oldPosition.x + dp.x, @oldPosition.y + dp.y)

  willBecomeInactive: (lc) ->
    @unsubscribe()
