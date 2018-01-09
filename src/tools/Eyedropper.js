{Tool} = require './base'


getPixel = (ctx, {x, y}) ->
  pixel = ctx.getImageData(x, y, 1, 1).data
  if pixel[3] then "rgb(#{pixel[0]}, #{pixel[1]}, #{pixel[2]})" else null


module.exports = class Eyedropper extends Tool

  name: 'Eyedropper'
  iconName: 'eyedropper'
  optionsStyle: 'stroke-or-fill'

  constructor: (lc) ->
    super(lc)
    @strokeOrFill = 'stroke'

  readColor: (x, y, lc) ->
    offset = lc.getDefaultImageRect()
    canvas = lc.getImage()
    newColor = getPixel(
      canvas.getContext('2d'),
      {x: x - offset.x, y: y - offset.y})
    color = newColor or lc.getColor('background')
    if @strokeOrFill == 'stroke'
      lc.setColor('primary', newColor)
    else
      lc.setColor('secondary', newColor)

  begin: (x, y, lc) -> @readColor(x, y, lc)
  continue: (x, y, lc) -> @readColor(x, y, lc)
