React = require '../reactGUI/React-shim'
{defineOptionsStyle} = require './optionsStyles'
{_} = require '../core/localization'


SANS_SERIF_FONTS = [
  ['Arial', 'Arial,"Helvetica Neue",Helvetica,sans-serif'],
  ['Arial Black', '"Arial Black","Arial Bold",Gadget,sans-serif'],
  ['Arial Narrow', '"Arial Narrow",Arial,sans-serif'],
  ['Gill Sans', '"Gill Sans","Gill Sans MT",Calibri,sans-serif'],
  ['Helvetica', '"Helvetica Neue",Helvetica,Arial,sans-serif']
  ['Impact', 'Impact,Haettenschweiler,"Franklin Gothic Bold",Charcoal,"Helvetica Inserat","Bitstream Vera Sans Bold","Arial Black",sans-serif'],
  ['Tahoma', 'Tahoma,Verdana,Segoe,sans-serif'],
  ['Trebuchet MS', '"Trebuchet MS","Lucida Grande","Lucida Sans Unicode","Lucida Sans",Tahoma,sans-serif'],
  ['Verdana', 'Verdana,Geneva,sans-serif'],
].map ([name, value]) -> {name: _(name), value}

SERIF_FONTS = [
  ['Baskerville', 'Baskerville,"Baskerville Old Face","Hoefler Text",Garamond,"Times New Roman",serif'],
  ['Garamond', 'Garamond,Baskerville,"Baskerville Old Face","Hoefler Text","Times New Roman",serif'],
  ['Georgia', 'Georgia,Times,"Times New Roman",serif'],
  ['Hoefler Text', '"Hoefler Text","Baskerville Old Face",Garamond,"Times New Roman",serif'],
  ['Lucida Bright', '"Lucida Bright",Georgia,serif'],
  ['Palatino', 'Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif'],
  ['Times New Roman', 'TimesNewRoman,"Times New Roman",Times,Baskerville,Georgia,serif'],
].map ([name, value]) -> {name: _(name), value}

MONOSPACE_FONTS = [
  ['Consolas/Monaco', 'Consolas,monaco,"Lucida Console",monospace'],
  ['Courier New', '"Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace'],
  ['Lucida Sans Typewriter', '"Lucida Sans Typewriter","Lucida Console",monaco,"Bitstream Vera Sans Mono",monospace'],
].map ([name, value]) -> {name: _(name), value}

OTHER_FONTS = [
  ['Copperplate', 'Copperplate,"Copperplate Gothic Light",fantasy'],
  ['Papyrus', 'Papyrus,fantasy'],
  ['Script', '"Brush Script MT",cursive'],
].map ([name, value]) -> {name: _(name), value}

ALL_FONTS = [
  [_('Sans Serif'), SANS_SERIF_FONTS],
  [_('Serif'), SERIF_FONTS],
  [_('Monospace'), MONOSPACE_FONTS],
  [_('Other'), OTHER_FONTS],
]

FONT_NAME_TO_VALUE = {}
for {name, value} in SANS_SERIF_FONTS
  FONT_NAME_TO_VALUE[name] = value
for {name, value} in SERIF_FONTS
  FONT_NAME_TO_VALUE[name] = value
for {name, value} in MONOSPACE_FONTS
  FONT_NAME_TO_VALUE[name] = value
for {name, value} in OTHER_FONTS
  FONT_NAME_TO_VALUE[name] = value


defineOptionsStyle 'font', React.createClass
  displayName: 'FontOptions'
  getInitialState: -> {
    isItalic: false
    isBold: false
    fontName: 'Helvetica',
    fontSizeIndex: 4
  }

  getFontSizes: -> [9, 10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288]

  # LC's text tool API is a little funky: it just has a 'font' string you can
  # set.
  updateTool: (newState = {}) ->
    for k of @state
      unless k of newState
        newState[k] = @state[k]
    fontSize = @getFontSizes()[newState.fontSizeIndex]
    items = []
    items.push('italic') if newState.isItalic
    items.push('bold') if newState.isBold
    items.push("#{fontSize}px")
    items.push(FONT_NAME_TO_VALUE[newState.fontName])
    @props.lc.tool.font = items.join(' ')
    @props.lc.trigger 'setFont', items.join(' ')

  handleFontSize: (event) ->
    newState = {fontSizeIndex: event.target.value}
    @setState(newState)
    @updateTool(newState)

  handleFontFamily: (event) ->
    newState = {
      fontName: event.target.selectedOptions[0].innerHTML,
    }
    @setState(newState)
    @updateTool(newState)

  handleItalic: (event) ->
    newState = {isItalic: !@state.isItalic}
    @setState(newState)
    @updateTool(newState)

  handleBold: (event) ->
    newState = {isBold: !@state.isBold}
    @setState(newState)
    @updateTool(newState)

  componentDidMount: -> @updateTool()

  render: ->
    lc = @props.lc

    {div, input, select, option, br, label, span, optgroup} = React.DOM

    (div {className: 'lc-font-settings'},
      (select {value: @state.fontSizeIndex, onChange: @handleFontSize},
        @getFontSizes().map((size, ix) =>
          (option {value: ix, key: ix}, "#{size}px")
        )
      )
      (select {value: @state.fontName, onChange: @handleFontFamily},
        ALL_FONTS.map ([label, fonts]) =>
          (optgroup {key: label, label}, fonts.map (family, ix) ->
            (option {value: family.name, key: ix}, family.name)
          )
      )
      (span {},
        (label {htmlFor: 'italic'}, _("italic")),
        (input \
          {
            type: 'checkbox',
            id: 'italic',
            checked: @state.isItalic,
            onChange: @handleItalic
          }
        )
      )
      (span {},
        (label {htmlFor: 'bold'}, _("bold")),
        (input \
          {
            type: 'checkbox',
            id: 'bold',
            checked: @state.isBold,
            onChange: @handleBold,
          }
        )
      )
    )


module.exports = {}
