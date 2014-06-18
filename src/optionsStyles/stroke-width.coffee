createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'
{defineOptionsStyle} = require './optionsStyles'


defineOptionsStyle 'stroke-width', React.createClass
  displayName: 'StrokeWidths'
  getState: -> {strokeWidth: @props.lc.tool?.strokeWidth}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {ul, li, svg, circle, div} = React.DOM
    strokeWidths = [1, 2, 5, 10, 20, 30]

    getItem = (strokeWidth) =>

    (ul {className: 'lc-stroke-widths'},
      strokeWidths.map((strokeWidth, ix) =>
        buttonClassName = React.addons.classSet
          'stroke-width-button': true
          'selected': strokeWidth == @state.strokeWidth
        buttonSize = 40
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


module.exports = {}