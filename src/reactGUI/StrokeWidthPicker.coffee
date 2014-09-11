createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'


module.exports = React.createClass
  displayName: 'StrokeWidthPicker'
  getState: -> {strokeWidth: @props.tool.strokeWidth}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {ul, li, svg, circle, div} = React.DOM
    strokeWidths = [1, 2, 5, 10, 20, 30]

    getItem = (strokeWidth) =>

    (ul {className: 'button-row'},
      strokeWidths.map((strokeWidth, ix) =>
        buttonClassName = React.addons.classSet
          'basic-button': true
          'selected': strokeWidth == @state.strokeWidth
        buttonSize = 30
        (li {className: 'lc-stroke-width', key: strokeWidth},
          (div \
            {
              className: buttonClassName,
              onClick: =>
                @props.tool.strokeWidth = strokeWidth
                @setState @getState()
            },
            (svg \
              {
                width: buttonSize
                height: buttonSize
                viewPort: "0 0 #{strokeWidth} #{strokeWidth}"
                version: "1.1"
                xmlns: "http://www.w3.org/2000/svg"
              },
              (circle {
                cx: Math.ceil(buttonSize/2),
                cy: Math.ceil(buttonSize/2),
                r: strokeWidth/2
              })
            )
          )
        )
      )
    )
