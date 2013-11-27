window.LC = window.LC ? {}


LC.toolbarHTML = '
  <div class="toolbar-row">
    <div class="toolbar-row-left">
      <div class="tools button-group"></div>
      &nbsp;&nbsp;&nbsp;&nbsp;Background:
      <div class="color-square background-picker">&nbsp;</div>
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

  <div class="toolbar-row">
    <div class="toolbar-row-left">
      <div class="color-square primary-picker"></div>
      <div class="color-square secondary-picker"></div>
      <div class="tool-options-container"></div>
    </div>
    <div class="clearfix"></div>
  </div>
'


LC.makeColorPicker = ($el, title, callback) ->
  $el.data('color', 'rgb(0, 0, 0)')
  cp = $el.colorpicker(format: 'rgba').data('colorpicker')
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

  _bindColorPicker: (name, title) ->
    $el = @$el.find(".#{name}-picker")
    $el.css('background-color', @lc.getColor(name))
    $el.css('background-position', "0% 0%")
    @lc.on "#{name}ColorChange", (color) =>
      $el.css('background-color', color)

    LC.makeColorPicker $el, "#{title} color", (c) =>
      @lc.setColor(name, "rgba(#{c.r}, #{c.g}, #{c.b}, #{c.a})")
      $el.css('background-position', "0% #{(1 - c.a) * 100}%")

  initColors: ->
    @$el.find('.primary-picker, .secondary-picker, .background-picker')
      .css('background-image', "url(#{@opts.imageURLPrefix}/alpha.png)")
    @$el.find('.secondary-picker')
      .css('background-position', "0% 100%")
    pickers = [
      @_bindColorPicker('primary', 'Primary (stroke)')
      @_bindColorPicker('secondary', 'Secondary (fill)')
      @_bindColorPicker('background', 'Background')
    ]

    @lc.$canvas.mousedown ->
      for picker in pickers
        picker.hide()
    @lc.$canvas.on 'touchstart', ->
      for picker in pickers
        picker.hide()

  initButtons: ->
    @$el.find('.clear-button').click (e) =>
      @lc.clear()

    @$el.find('.undo-button').click (e) =>
      @lc.undo()

    @$el.find('.redo-button').click (e) =>
      @lc.redo()

  initTools: ->
    @tools = []
    for ToolClass in @opts.toolClasses
      t = new ToolClass(@opts)
      @tools.push(t)
      @addTool(t)

  addTool: (t) ->
    optsEl = $("<div class='tool-options tool-options-#{t.cssSuffix}'></div>")
    optsEl.html(t.options())
    optsEl.hide()
    t.$el = optsEl
    @$el.find('.tool-options-container').append(optsEl)

    buttonEl = $("<div class='button tool-#{t.cssSuffix}'>
        <div class='tool-image-wrapper'></div></div>")
      .appendTo(@$el.find('.tools'))
      .find('.tool-image-wrapper')
      .html(t.button())

    buttonEl.click (e) =>
      @selectTool(t)
    null

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
    t.select(@lc)
    @$el.find('.tool-options').hide()
    t.$el.show() if t.$el
