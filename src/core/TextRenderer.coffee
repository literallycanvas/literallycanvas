require './fontmetrics.js'


parseFontString = (font) ->
  fontItems = font.split(' ')
  fontSize = parseInt(fontItems[0].replace("px", ""), 10)

  remainingFontString = font.substring(fontItems[0].length + 1)
    .replace('bold ', '')
    .replace('italic ', '')
    .replace('underline ', '')

  fontFamily = remainingFontString

  {fontSize, fontFamily}


getLinesToRender = (ctx, text, forcedWidth) ->
  n = 0
  return [text] unless forcedWidth
  endIndex = 0
  remainingText = text
  lines = []
  while remainingText.length
    n += 1
    throw "?" unless n < 30
    maybeText = remainingText.substring(0, endIndex + 1)
    hasText = maybeText.length == endIndex + 1
    doesFit = ctx.measureTextWidth(maybeText).width <= forcedWidth
    if hasText and (doesFit or endIndex == 0)
      endIndex += 1
    else
      lines.push remainingText.substring(0, endIndex)
      remainingText = remainingText.substring(endIndex)
      endIndex = 0
  return lines


class TextRenderer
  constructor: (ctx, @text, @font, @forcedWidth, @forcedHeight) ->
    {fontFamily, fontSize} = parseFontString(@font)

    ctx.font  = @font
    ctx.textBaseline = 'baseline'
    @metrics = ctx.measureText2(@text or 'X', fontSize, fontFamily)
    @boundingBoxWidth = Math.ceil(@metrics.width)

    @lines = getLinesToRender(ctx, text, @forcedWidth)
    console.log @lines

  draw: (ctx, x, y) ->
    ctx.textBaseline = 'top'
    ctx.font = @font
    i = 0
    for line in @lines
      ctx.fillText(line, x, y + i * @metrics.leading)
      i += 1

  getWidth: -> @forcedWidth or @metrics.bounds.maxx,
  getHeight: -> @forcedHeight or (@metrics.leading * @lines.length)


module.exports = TextRenderer