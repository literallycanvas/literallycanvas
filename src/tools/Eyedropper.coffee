{Tool} = require './base'


getPixel = (ctx, {x, y}) ->
  pixel = ctx.getImageData(x, y, 1, 1).data
  if pixel[3] then "rgb(#{pixel[0]}, #{pixel[1]}, #{pixel[2]})" else null


module.exports = class Eyedropper extends Tool

  name: 'Eyedropper'
  iconName: 'eyedropper'

  readColor: (x, y, lc) ->
    offset = lc.getDefaultImageRect()
    canvas = lc.getImage()
    newColor = getPixel(
      canvas.getContext('2d'),
      {x: x - offset.x, y: y - offset.y})
    lc.setColor('primary', newColor or lc.getColor('background'))

  begin: (x, y, lc) ->
    @readColor(x, y, lc)

  continue: (x, y, lc) ->
    @readColor(x, y, lc)
