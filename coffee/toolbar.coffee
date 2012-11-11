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
]


class LC.Toolbar
  constructor: (@lc, @$el) ->
    _.each LC.defaultColors, (c) =>
      sq = $("
        <div class='color-square'></div>
      ")
      sq.css('background-color', c)
      @$el.append(sq)
      $(sq).click =>
        console.log c
        @lc.state.strokeColor = c
