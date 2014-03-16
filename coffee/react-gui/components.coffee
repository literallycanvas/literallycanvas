window.LC = LC or {}
LC.React = LC.React or {}


createToolComponent = ({displayName, getTool, imageName}) ->
  tool = getTool()
  React.createClass
    displayName: displayName,
    componentWillMount: ->
      if @props.isSelected and not @props.lc.tool
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