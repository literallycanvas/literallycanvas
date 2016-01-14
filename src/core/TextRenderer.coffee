require './fontmetrics.js'


parseFontString = (font) ->
  fontItems = font.split(' ')

  fontSize = 0

  for item in fontItems
    maybeSize = parseInt(item.replace("px", ""), 10)
    unless isNaN(maybeSize)
      fontSize = maybeSize
  throw "Font size not found" unless fontSize

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
    doesSubstringFit = if forcedWidth
      ctx.measureTextWidth(textToHere).width <= forcedWidth
    else
      true

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
  textSplitOnLines = text.split(/\r\n|\r|\n/g)

  lines = []
  for textLine in textSplitOnLines
    [nextLine, remainingText] = getNextLine(ctx, textLine, forcedWidth)
    if nextLine
      while nextLine
        lines.push(nextLine)
        [nextLine, remainingText] = getNextLine(
          ctx, remainingText, forcedWidth)
    else
      lines.push(textLine)
  return lines


class TextRenderer
  constructor: (ctx, @text, @font, @forcedWidth, @forcedHeight) ->
    {fontFamily, fontSize} = parseFontString(@font)

    ctx.font = @font
    ctx.textBaseline = 'baseline'
    @emDashWidth = ctx.measureTextWidth('—', fontSize, fontFamily).width
    @caratWidth = ctx.measureTextWidth('|', fontSize, fontFamily).width

    @lines = getLinesToRender(ctx, @text, @forcedWidth)

    # we need to get metrics line by line and combine them. :-(
    @metricses = @lines.map (line) =>
      ctx.measureText2(line or 'X', fontSize, @font)

    @metrics = {
      ascent: Math.max(@metricses.map(({ascent}) -> ascent)...)
      descent: Math.max(@metricses.map(({descent}) -> descent)...)
      fontsize: Math.max(@metricses.map(({fontsize}) -> fontsize)...)
      leading: Math.max(@metricses.map(({leading}) -> leading)...)
      width: Math.max(@metricses.map(({width}) -> width)...)
      height: Math.max(@metricses.map(({height}) -> height)...)
      bounds: {
        minx: Math.min(@metricses.map(({bounds}) -> bounds.minx)...)
        miny: Math.min(@metricses.map(({bounds}) -> bounds.miny)...)
        maxx: Math.max(@metricses.map(({bounds}) -> bounds.maxx)...)
        maxy: Math.max(@metricses.map(({bounds}) -> bounds.maxy)...)
      }
    }

    @boundingBoxWidth = Math.ceil(@metrics.width)

  draw: (ctx, x, y) ->
    ctx.textBaseline = 'top'
    ctx.font = @font
    i = 0
    for line in @lines
      ctx.fillText(line, x, y + i * @metrics.leading)
      i += 1

  getWidth: (isEditing=false) ->
    # if isEditing == true, add X padding to account for carat
    if @forcedWidth
      return @forcedWidth
    else
      if isEditing
        return @metrics.bounds.maxx + @caratWidth
      else
        return @metrics.bounds.maxx
  getHeight: -> @forcedHeight or (@metrics.leading * @lines.length)


module.exports = TextRenderer