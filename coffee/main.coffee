window.LC = window.LC ? {}


LC.init = (el, opts = {}) ->
  opts = _.extend({
    primaryColor: 'rgba(0, 0, 0, 1)'
    secondaryColor: 'rgba(0, 0, 0, 0)'
    backgroundColor: 'rgb(230, 230, 230)'
    imageURLPrefix: 'lib/img'
    keyboardShortcuts: true
    sizeToContainer: true
    watermarkImageURL: null
    toolClasses: [
        LC.PencilWidget, LC.EraserWidget, LC.LineWidget, LC.RectangleWidget,
        LC.PanWidget, LC.EyeDropperWidget]
  }, opts)
  $el = $(el)
  $el.addClass('literally')
  $tbEl = $('<div class="toolbar">')

  $el.append($tbEl)

  lc = new LC.LiterallyCanvas($el.find('canvas').get(0), opts)
  tb = new LC.Toolbar(lc, $tbEl, opts)
  tb.selectTool(tb.tools[0])

  resize = ->
    if opts.sizeToContainer
      lc.$canvas.css('height', "#{$el.height() - $tbEl.height()}px")
    lc.$canvas.attr('width', lc.$canvas.width())
    lc.$canvas.attr('height', lc.$canvas.height())
    lc.repaint()

  $el.resize(resize)
  $(window).resize(resize)
  resize()

  if opts.keyboardShortcuts
    $(document).keydown (e) ->
      switch e.which
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10

      lc.repaint()

  [lc, tb]


$.fn.literallycanvas = (opts = {}) ->
  @each (ix, el) =>
    [el.literallycanvas, el.literallycanvasToolbar] = LC.init(el, opts)
  this


$.fn.canvasForExport = ->
  @get(0).literallycanvas.canvasForExport()
