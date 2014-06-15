{Tool} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Eyedropper extends Tool

  name: 'Eyedropper'
  iconName: 'eyedropper'

  readColor: (x, y, lc) ->
    newColor = lc.getPixel(x, y)
    lc.setColor('primary', newColor or lc.getColor('background'))

  begin: (x, y, lc) ->
    @readColor(x, y, lc)

  continue: (x, y, lc) ->
    @readColor(x, y, lc)
