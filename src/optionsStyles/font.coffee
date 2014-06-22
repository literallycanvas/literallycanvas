{defineOptionsStyle} = require './optionsStyles'
{_} = require '../core/localization'

defineOptionsStyle 'font', React.createClass
  displayName: 'FontOptions'
  getText: -> @props.lc.tool?.text
  getInitialState: -> {
    text: @getText()
    isItalic: false
    isBold: false
    fontFamilyIndex: 0
    fontSizeIndex: 4
  }

  getFontSizes: -> [9, 10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288]

  getFamilies: ->
    lc = @props.lc

    [
      {name: _('Sans-serif'), value: '"Helvetica Neue",Helvetica,Arial,sans-serif'},
      {name: _('Serif'), value: (
        'Garamond,Baskerville,"Baskerville Old Face",'
        '"Hoefler Text","Times New Roman",serif')}
      {name: _('Typewriter'), value: (
        '"Courier New",Courier,"Lucida Sans Typewriter",'
        '"Lucida Typewriter",monospace')},
    ]

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
    items.push(@getFamilies()[newState.fontFamilyIndex].value)
    @props.lc.tool.font = items.join(' ')

  handleText: (event) ->
    @props.lc.tool.text = event.target.value
    @setState {text: @getText()}

  handleFontSize: (event) ->
    newState = {fontSizeIndex: event.target.value}
    @setState(newState)
    @updateTool(newState)

  handleFontFamily: (event) ->
    newState = {fontFamilyIndex: event.target.value}
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

    {div, input, select, option, br, label, span} = React.DOM

    (div {className: 'lc-font-settings'},
      (input \
        {
          type: 'text'
          placeholder: _('Enter text here')
          value: @state.text
          onChange: @handleText
        }
      )
      (span {className: 'instructions'}, _("Click and hold to place text."))

      (br())

      _("Size: ")
      (select {value: @state.fontSizeIndex, onChange: @handleFontSize},
        @getFontSizes().map((size, ix) =>
          (option {value: ix, key: ix}, size)
        )
      )
      (select {value: @state.fontFamilyIndex, onChange: @handleFontFamily},
        @getFamilies().map((family, ix) =>
          (option {value: ix, key: ix}, family.name)
        )
      )
      (label {htmlFor: 'italic'},
        (input \
          {
            type: 'checkbox',
            id: 'italic',
            checked: @state.isItalic,
            onChange: @handleItalic
          },
          _("italic")
        )
      )
      (label {htmlFor: 'bold'},
        (input \
          {
            type: 'checkbox',
            id: 'bold',
            checked: @state.isBold,
            onChange: @handleBold,
          },
          _("bold")
        )
      )
    )


module.exports = {}
