class LC.Widget

  constructor: (@opts) ->

  # text to be shown in a hypothetical tooltip
  title: undefined

  # suffix of the CSS elements that are generated for this class.
  # specficially tool-{suffix} for the button, and tool-options-{suffix} for
  # the options container.
  cssSuffix: undefined

  # function that returns the HTML of the tool button's contents
  button: -> undefined

  # function that returns the HTML of the tool options
  options: -> undefined

  # called when the widget is selected
  select: (lc) ->


class LC.ToolWidget extends LC.Widget

  constructor: (@opts) ->
    @tool = @makeTool()

  select: (lc) ->
    lc.setTool(@tool)

  makeTool: -> undefined


class LC.StrokeWidget extends LC.ToolWidget

  options: ->
    $el = $("<span class='brush-width-min'>1 px</span><input type='range' min='1' max='50' step='1' value='#{@tool.strokeWidth}'><span class='brush-width-max'>50 px</span><span class='brush-width-val'>(5 px)</span>")

    $input = $el.filter('input')
    if $input.size() == 0
      $input = $el.find('input')

    $brushWidthVal = $el.filter('.brush-width-val')
    if $brushWidthVal.size() == 0
      $brushWidthVal = $el.find('.brush-width-val')

    $input.change (e) =>
      @tool.strokeWidth = parseInt($(e.currentTarget).val(), 10)
      $brushWidthVal.html("(#{@tool.strokeWidth} px)")
    return $el


class LC.RectangleWidget extends LC.StrokeWidget

  title: 'Rectangle'
  cssSuffix: 'rectangle'
  button: -> "<img src='#{@opts.imageURLPrefix}/rectangle.png'>"
  makeTool: -> new LC.RectangleTool()


class LC.LineWidget extends LC.StrokeWidget

  title: 'Line'
  cssSuffix: 'line'
  button: -> "<img src='#{@opts.imageURLPrefix}/line.png'>"
  makeTool: -> new LC.LineTool()


class LC.PencilWidget extends LC.StrokeWidget

  title: "Pencil"
  cssSuffix: "pencil"
  button: -> "<img src='#{@opts.imageURLPrefix}/pencil.png'>"
  makeTool: -> new LC.Pencil()


class LC.EraserWidget extends LC.PencilWidget

  title: "Eraser"
  cssSuffix: "eraser"
  button: -> "<img src='#{@opts.imageURLPrefix}/eraser.png'>"
  makeTool: -> new LC.Eraser()


class LC.PanWidget extends LC.ToolWidget

  title: "Pan"
  cssSuffix: "pan"
  button: -> "<img src='#{@opts.imageURLPrefix}/pan.png'>"
  makeTool: -> new LC.Pan()


class LC.EyeDropperWidget extends LC.ToolWidget

  title: "Eyedropper"
  cssSuffix: "eye-dropper"
  button: -> "<img src='#{@opts.imageURLPrefix}/eyedropper.png'>"
  makeTool: -> new LC.EyeDropper()


class LC.TextWidget extends LC.ToolWidget
  # this class is a mess. if you want clean code, write your own damn GUI.

  getFamilies: -> [
    {name: 'Sans-serif', value: '"Helvetica Neue",Helvetica,Arial,sans-serif'},
    {name: 'Serif', value: (
      'Garamond,Baskerville,"Baskerville Old Face",'
      '"Hoefler Text","Times New Roman",serif')}
    {name: 'Typewriter', value: (
      '"Courier New",Courier,"Lucida Sans Typewriter",'
      '"Lucida Typewriter",monospace')},
  ]

  title: "Text"
  cssSuffix: "text"

  constructor: (args...) ->
    super(args...)

  button: -> "<img src='#{@opts.imageURLPrefix}/text.png'>"
  select: (lc) ->
    @updateTool()
    lc.setTool(@tool)
    # not sure why we need to defer this, but I don't get paid enough to work
    # on this to find out why.
    setTimeout((=>
      @$input.focus()
      @$input.select()
    ), 0)
  makeTool: -> 
    new LC.TextTool()

  options: ->
    familyOptions = []
    i = 0
    for family in @getFamilies()
      familyOptions.push "<option value=#{i}>#{family.name}</option>"
      i += 1

    @$el = $(
      "<div>
       <input type='text' id='text' placeholder='Enter text here'
        value='#{@tool.text}'>
       <input type='text' id='font-size' value='18'>
       <select id='family'>#{familyOptions.join('')}</select>
       <label for='italic'><input type='checkbox' id='italic'>italic</label>
       <label for='bold'><input type='checkbox' id='bold'>bold</label>
       <span class='instructions'>Click and hold to place text.</span>
       </div>")

    @$input = @$el.find('input#text')
    $fontSize = @$el.find('input#font-size')
    updateAndFocus = =>
      @updateTool()
      @$input.focus()

    @$input.keyup => @updateTool()
    $fontSize.keyup => @updateTool()
    @$input.change(updateAndFocus)
    $fontSize.change(updateAndFocus)
    @$el.find('input#italic').change(updateAndFocus)
    @$el.find('input#bold').change(updateAndFocus)
    @$el.find('#family').change(updateAndFocus)

    @$el

  updateTool: ->
    items = []
    if @$el.find('input#italic').is(':checked')
      items.push('italic')
    if @$el.find('input#bold').is(':checked')
      items.push('bold')
    items.push("#{parseInt(@$el.find('input#font-size').val(), 10)}px")

    familyIndex = parseInt(@$el.find('select#family').val(), 10)
    items.push(@getFamilies()[familyIndex].value)

    @tool.font = items.join(' ')
    @tool.text = @$el.find('input#text').val()
