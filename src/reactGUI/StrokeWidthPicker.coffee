createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'


module.exports = React.createClass
  displayName: 'StrokeWidthPicker'
  getState: -> {strokeWidth: @props.tool.strokeWidth}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {ul, li, svg, circle, div} = React.DOM
    strokeWidths = [1, 2, 5, 10, 20, 30]

    (div {},
      strokeWidths.map((strokeWidth, ix) =>
        buttonClassName = React.addons.classSet
          'square-toolbar-button': true
          'selected': strokeWidth == @state.strokeWidth
        buttonSize = 28
        (div {
            key: strokeWidth,
            style: {
              float: 'left',
              width: buttonSize,
              height: buttonSize,
              margin: 1
            }
          },
          (div \
            {
              className: buttonClassName,
              onClick: =>
                @props.tool.strokeWidth = strokeWidth
                @setState @getState()
            },
            (svg \
              {
                width: buttonSize-2
                height: buttonSize-2
                viewPort: "0 0 #{strokeWidth} #{strokeWidth}"
                version: "1.1"
                xmlns: "http://www.w3.org/2000/svg"
              },
              (circle {
                cx: Math.ceil(buttonSize/2-1),
                cy: Math.ceil(buttonSize/2-1),
                r: strokeWidth/2
              })
            )
          )
        )
      )
    )
