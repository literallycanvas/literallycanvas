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


getNextLine = (ctx, text, forcedWidth) ->
  if !text.length
    return ['', '']

  endIndex = 0
  lastGoodIndex = 0
  lastOkayIndex = 0
  wasInWord = false

  while true
    endIndex += 1
    isEndOfString = endIndex >= text.length

    isWhitespace = (not isEndOfString) and text[endIndex].match(/\s/)
    isNonWord = isWhitespace or isEndOfString

    textToHere = text.substring(0, endIndex)
    doesSubstringFit = ctx.measureTextWidth(textToHere).width <= forcedWidth

    if doesSubstringFit
      lastOkayIndex = endIndex

    # word -> non-word
    if isNonWord and wasInWord
      wasInWord = false
      if doesSubstringFit
        lastGoodIndex = endIndex

    wasInWord = !isWhitespace

    if isEndOfString or !doesSubstringFit
      if doesSubstringFit
        return [text, '']
      else if lastGoodIndex > 0
        nextWordStartIndex = lastGoodIndex + 1
        while nextWordStartIndex < text.length and text[nextWordStartIndex].match('/\s/')
          nextWordStartIndex += 1
        return [
          text.substring(0, lastGoodIndex), text.substring(nextWordStartIndex)]
      else
        return [
          text.substring(0, lastOkayIndex), text.substring(lastOkayIndex)]


getLinesToRender = (ctx, text, forcedWidth) ->
  return [text] unless forcedWidth

  lines = []
  [nextLine, remainingText] = getNextLine(ctx, text, forcedWidth)
  while nextLine
    lines.push(nextLine)
    [nextLine, remainingText] = getNextLine(ctx, remainingText, forcedWidth)
  return lines


class TextRenderer
  constructor: (ctx, @text, @font, @forcedWidth, @forcedHeight) ->
    {fontFamily, fontSize} = parseFontString(@font)

    ctx.font  = @font
    ctx.textBaseline = 'baseline'
    @metrics = ctx.measureText2(@text or 'X', fontSize, fontFamily)
    @boundingBoxWidth = Math.ceil(@metrics.width)

    @lines = getLinesToRender(ctx, text, @forcedWidth)

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