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

LC.defaultStrokeColor = 'rgba(0, 0, 0, 0.9)'
LC.defaultFillColor = 'rgba(255, 255, 255, 0.9)'


LC.toolbarHTML = '
  <div class="toolbar-row">
    <div class="toolbar-row-left">
      <div class="button color-square stroke-picker">&nbsp;</div>
      <div class="tools button-group"></div>
      <div class="tool-options-container"></div>
    </div>

    <div class="toolbar-row-right">
      <div class="action-buttons">
        <div class="button clear-button danger">Clear</div>
        <div class="button-group">
          <div class="button btn-warning undo-button">&larr;</div><div class="button btn-warning redo-button">&rarr;</div>
        </div>
        <div class="button-group">
          <div class="button btn-inverse zoom-out-button">&ndash;</div><div class="button btn-inverse zoom-in-button">+</div>
        </div>
        <div class="zoom-display">1</div>
      </div>
    </div>
    <div class="clearfix"></div>
  </div>
'


LC.makeColorPicker = ($el, title, callback) ->
  $el.data('color', 'rgb(0, 0, 0)')
  cp = $el.colorpicker(format: 'rgb').data('colorpicker')
  cp.hide()
  $el.on 'changeColor', (e) ->
    callback(e.color.toRGB())
    $(document).one 'click', ->
      cp.hide()
  $el.click (e) ->
    if cp.picker.is(':visible')
      cp.hide()
    else
      $(document).one 'click', ->
        # quick hack; we're actually still in the same click event
        $(document).one 'click', ->
          cp.hide()
      cp.show()
      cp.place()
  return cp


class LC.Toolbar

  constructor: (@lc, @$el, @opts) ->
    @$el.append(LC.toolbarHTML)
    @initColors()
    @initButtons()
    @initTools()
    @initZoom()

  initColors: ->
    $stroke = @$el.find('.stroke-picker')
    $stroke.css('background-color', LC.defaultStrokeColor)
    cp = LC.makeColorPicker $stroke, 'Foreground color', (c) =>
      val = "rgba(#{c.r}, #{c.g}, #{c.b}, 1)"
      $stroke.css('background-color', val)
      @lc.primaryColor = val
    @lc.$canvas.mousedown ->
      cp.hide()
    @lc.$canvas.on 'touchstart', ->
      cp.hide()

    @lc.on 'colorChange', (color) ->
      $stroke.css('background-color', color)

  initButtons: ->
    @$el.find('.clear-button').click (e) =>
      @lc.clear()

    @$el.find('.undo-button').click (e) =>
      @lc.undo()

    @$el.find('.redo-button').click (e) =>
      @lc.redo()

  initTools: ->
    @tools = (new ToolClass(@opts) for ToolClass in @opts.toolClasses)
    _.each @tools, (t) =>
      optsEl = $("<div class='tool-options tool-options-#{t.cssSuffix}'></div>")
      optsEl.html(t.optionsContents())
      optsEl.hide()
      t.$el = optsEl
      @$el.find('.tool-options-container').append(optsEl)

      buttonEl = $("<div class='button tool-#{t.cssSuffix}'></div>")
      buttonEl.html(t.buttonContents())
      @$el.find('.tools').append(buttonEl)

      buttonEl.click (e) =>
        @selectTool(t)

  initZoom: ->
    @$el.find('.zoom-in-button').click (e) =>
      @lc.zoom(0.2)
      @$el.find('.zoom-display').html(@lc.scale)

    @$el.find('.zoom-out-button').click (e) =>
      @lc.zoom(-0.2)
      @$el.find('.zoom-display').html(@lc.scale)

  selectTool: (t) ->
    @$el.find(".tools .active").removeClass("active")
    @$el.find(".tools .tool-#{t.cssSuffix}").addClass("active")
    @lc.tool = t
    @$el.find('.tool-options').hide()
    t.$el.show() if t.$el
