window.LC = LC or {}
LC.React = LC.React or {}


LC.React.Options = React.createClass
  displayName: 'Options'
  getState: -> {
    style: @props.lc.tool?.optionsStyle
    tool: @props.lc.tool
  }
  getInitialState: -> @getState()
  mixins: [LC.React.Mixins.UpdateOnToolChangeMixin]

  render: ->
    # style can be null; cast it as a string
    style = "" + @state.style
    LC.React.OptionsStyles[style]({lc: @props.lc, tool: @state.tool})


LC.React.OptionsStyles =
  'font': React.createClass
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

    getFamilies: -> [
      {name: 'Sans-serif', value: '"Helvetica Neue",Helvetica,Arial,sans-serif'},
      {name: 'Serif', value: (
        'Garamond,Baskerville,"Baskerville Old Face",'
        '"Hoefler Text","Times New Roman",serif')}
      {name: 'Typewriter', value: (
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
      {div, input, select, option, br, label, span} = React.DOM

      (div {className: 'lc-font-settings'},
        (input \
          {
            type: 'text'
            placeholder: 'Enter text here'
            value: @state.text
            onChange: @handleText
          }
        )
        (span {className: 'instructions'}, "Click and hold to place text.")

        (br())

        "Size: "
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
            "italic"
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
            "bold"
          )
        )
      )

  'stroke-width': React.createClass
    displayName: 'StrokeWidths'
    getState: -> {strokeWidth: @props.lc.tool?.strokeWidth}
    getInitialState: -> @getState()
    mixins: [LC.React.Mixins.UpdateOnToolChangeMixin]

    render: ->
      {ul, li, svg, circle} = React.DOM
      strokeWidths = [1, 2, 5, 10, 20, 40]
      buttonSize = Math.max(strokeWidths...)

      getItem = (strokeWidth) =>

      (ul {className: 'lc-stroke-widths'},
        strokeWidths.map((strokeWidth, ix) =>
          className = React.addons.classSet
            'lc-stroke-width': true
            'selected': strokeWidth == @state.strokeWidth
          (li \
            {
              className,
              key: strokeWidth,
              onClick: =>
                @props.tool.strokeWidth = strokeWidth
                @setState @getState()
            },
            (svg \
              {
                width: buttonSize
                height: buttonSize
                viewPort: "0 0 #{buttonSize} #{buttonSize}"
                version: "1.1"
                xmlns: "http://www.w3.org/2000/svg"
              },
              (circle {cx: buttonSize/2, cy: buttonSize/2, r: strokeWidth/2})
            )
          )
        )
      )

  'null': React.createClass
    displayName: 'NoOptions'
    render: -> React.DOM.div()
