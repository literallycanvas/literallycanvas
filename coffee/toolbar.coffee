window.LC = window.LC ? {}

LC.defaultColors = [
  'rgba(255, 0, 0, 0.9)',
  'rgba(255, 128, 0, 0.9)',
  'rgba(255, 255, 0, 0.9)',
  'rgba(128, 255, 0, 0.9)',
  'rgba(0, 255, 0, 0.9)',
  'rgba(0, 255, 128, 0.9)',
  'rgba(0, 128, 255, 0.9)',
  'rgba(0, 0, 255, 0.9)',
  'rgba(128, 0, 255, 0.9)',
  'rgba(255, 0, 128, 0.9)',
  'rgba(0, 0, 0, 0.9)',
  'rgba(255, 255, 255, 0.9)',
]


class LC.Toolbar
  constructor: (@lc, @$el) ->
    @initColors()
    @initButtons()

  initColors: ->
    $colorsEl = @$el.find('.colors')
    _.each LC.defaultColors, (c) =>
      $sq = $("
        <div class='color-square'></div>
      ")
      $sq.css('background-color', c)
      $colorsEl.append($sq)
      $sq.click =>
        @lc.primaryColor = c
        $colorsEl.find('.color-square').removeClass('active')
        $sq.addClass('active')

  initButtons: ->
    @$el.find('.clear-button').click (e) =>
      @lc.clear()

    @$el.find('.undo-button').click (e) =>
      @lc.undo()

    @$el.find('.redo-button').click (e) =>
      @lc.redo()
