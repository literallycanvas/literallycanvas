window.LC = LC or {}
LC.React = LC.React or {}


createToolComponent = ({displayName, getTool, imageName}) ->
  tool = getTool()
  React.createClass
    displayName: displayName,
    componentWillMount: ->
      if @props.isSelected
        # prevent race condition with options, tools getting set
        @props.lc.setTool(tool)
    render: ->
      {div, img} = React.DOM
      {imageURLPrefix, isSelected, onSelect} = @props

      className = React.addons.classSet
        'lc-pick-tool': true
        'toolbar-button': true
        'thin-button': true
        'selected': isSelected
      (div {className, onClick: -> onSelect(tool)},
        (img \
          {
            className: 'lc-tool-icon',
            src: "#{imageURLPrefix}/#{imageName}.png"
          }
        )
      )


LC.React.ToolButtons =

  Pencil: createToolComponent
    displayName: 'Pencil'
    imageName: 'pencil'
    getTool: -> new LC.Pencil()

  Eraser: createToolComponent
    displayName: 'Eraser'
    imageName: 'eraser'
    getTool: -> new LC.Eraser()

  Line: createToolComponent
    displayName: 'Line'
    imageName: 'line'
    getTool: -> new LC.LineTool()

  Rectangle: createToolComponent
    displayName: 'Rectangle'
    imageName: 'rectangle'
    getTool: -> new LC.RectangleTool()

  Text: createToolComponent
    displayName: 'Text'
    imageName: 'text'
    getTool: -> new LC.TextTool()

  Pan: createToolComponent
    displayName: 'Pan'
    imageName: 'pan'
    getTool: -> new LC.Pan()

  Eyedropper: createToolComponent
    displayName: 'Eyedropper'
    imageName: 'eyedropper'
    getTool: -> new LC.EyeDropper()


LC.React.Mixins =
  UpdateOnDrawingChangeMixin:
    componentDidMount: ->
      @subscriber = => @setState @getState()
      @props.lc.on 'drawingChange', @subscriber
    componentWillUnmount: ->
      @props.lc.removeEventListener('drawingChange', @subscriber)

  UpdateOnToolChangeMixin:
    componentDidMount: ->
      @subscriber = => @setState @getState()
      @props.lc.on 'toolChange', @subscriber
    componentWillUnmount: ->
      @props.lc.removeEventListener('toolChange', @subscriber)


LC.React.Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 4}
  render: ->
    {div} = React.DOM
    {toolNames, lc, root, imageURLPrefix} = @props
    (div {className: 'lc-picker-contents'},
      toolNames.map((name, ix) =>
        (LC.React.ToolButtons[name] \
          {
            lc, root, imageURLPrefix,
            key: ix
            isSelected: ix == @state.selectedToolIndex,
            onSelect: (tool) =>
              lc.setTool(tool)
              @setState({selectedToolIndex: ix})
          }
        )
      ),
      if toolNames.length % 2 != 0
        (div {className: 'toolbar-button thin-button disabled'})
      LC.React.UndoRedo({lc, imageURLPrefix}),
      LC.React.ClearButton({lc})
    )


LC.React.UndoRedo = React.createClass
  displayName: 'UndoRedo'
  render: ->
    {div} = React.DOM
    {lc} = @props
    (div {className: 'lc-undo-redo'},
      LC.React.UndoButton({lc}),
      LC.React.RedoButton({lc})
    )


LC.React.UndoButton = React.createClass
  displayName: 'UndoButton'

  # We do this a lot, even though it reads as a React no-no.
  # The reason is that '@props.lc' is a monolithic state bucket for
  # Literally Canvas, and does not offer opportunities for encapsulation.
  #
  # However, this component really does read and write only to the 'undo'
  # part of the state bucket, and we have to get react to update somehow, and
  # we don't want the parent to have to worry about this, so it's in @state.
  getState: -> {isEnabled: @props.lc.canUndo()}
  getInitialState: -> @getState()
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-undo': true
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canUndo() then (=> lc.undo()) else ->

    (div {
      className, onClick,
      dangerouslySetInnerHTML: {__html: "&larr;"}})


LC.React.RedoButton = React.createClass
  displayName: 'RedoButton'
  getState: -> {isEnabled: @props.lc.canRedo()}
  getInitialState: -> @getState()
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-redo': true
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canRedo() then (=> lc.redo()) else ->

    (div {
      className, onClick,
      dangerouslySetInnerHTML: {__html: "&rarr;"}})


LC.React.ClearButton = React.createClass
  displayName: 'ClearButton'
  getState: -> {isEnabled: @props.lc.canUndo()}
  getInitialState: -> @getState()
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-clear': true
      'toolbar-button': true
      'fat-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canUndo() then (=> lc.clear()) else ->

    (div {className, onClick}, 'Clear')


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
