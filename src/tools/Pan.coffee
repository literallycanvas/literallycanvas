{Tool} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Pan extends Tool

  name: 'Pan'
  iconName: 'pan'

  begin: (x, y, lc) -> @start = {x, y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaintAllLayers()

  end: (x, y, lc) ->
    lc.repaintAllLayers()
