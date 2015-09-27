React = require './React-shim'
{classSet} = require '../core/util'


getPosition = (element) =>
  xPosition = 0
  yPosition = 0
      
  while (element)
      xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft)
      yPosition += (element.offsetTop - element.scrollTop + element.clientTop)
      element = element.offsetParent
  {x: xPosition, y: yPosition}


Slider = React.createFactory React.createClass
  displayName: 'Slider'
  getDefaultProps: -> {min: 0, max: 1, onChange: ->}
  getInitialState: -> {value: @props.initialValue}
  render: ->
    {div} = React.DOM
    rangeSize = @props.max - @props.min
    pos = (@state.value - @props.min) / rangeSize
    posPercent = pos * 100 + '%'

    lineH = 4
    rad = 8
    m = 4
    fullH = m * 2 + rad * 2
    lineM = (fullH - lineH) / 2

    update = (e) =>
      e.stopPropagation()
      el = @getDOMNode()
      parentPosition = getPosition(el)
      x = e.clientX - parentPosition.x
      positionInRange = (x - lineM) / (el.clientWidth - lineM * 2)
      val = Math.max(@props.min, Math.min(@props.max, @props.min + rangeSize * positionInRange))
      @setState({value: val})
      @props.onChange(val)

    (div {
        style: {position: 'relative', width: '100%', height: fullH},
        onClick: update
        onMouseMove: (e) => update(e) if @state.isMouseDown
        onMouseDown: => @setState({isMouseDown: true})
        onMouseUp: => @setState({isMouseDown: false})
        onMouseLeave: => @setState({isMouseDown: false})
      },
      (div {style: {
        position: 'absolute', top: lineM, right: lineM, bottom: lineM, left: lineM,
        backgroundColor: 'black', borderRadius: lineH / 2}},
        (div {style: {
          borderRadius: rad,
          backgroundColor: '#aaa',
          border: '1px solid black',
          position: 'absolute',
          top: -(rad - lineH / 2),
          left: posPercent,
          width: rad * 2, height: rad * 2,
          transform: "translate(-#{rad}px,0px)"
        }})
      )
    )


ColorWell = React.createClass
  displayName: 'ColorWell'
  getInitialState: -> {
    color: @props.lc.colors[@props.colorName],
    isPickerVisible: false,
    alpha: 1
  }

  # our color state tracks lc's
  componentDidMount: ->
    @unsubscribe = @props.lc.on "#{@props.colorName}ColorChange", =>
      @setState {color: @props.lc.colors[@props.colorName]}
  componentWillUnmount: -> @unsubscribe()

  togglePicker: -> @setState {isPickerVisible: not @state.isPickerVisible}
  closePicker: -> @setState {isPickerVisible: false}
  setColor: (c) -> @props.lc.setColor(@props.colorName, c)

  render: ->
    {div, label, br} = React.DOM
    (div \
      {
        className: classSet({
          'color-well': true,
          'open': @state.isPickerVisible ,
        }),
        onMouseLeave: @closePicker
        onClick: @togglePicker
        style: {float: 'left', textAlign: 'center'}
      },
      (label {float: 'left'}, @props.label),
      (br {}),
      (div \
        {
          className: classSet
            'color-well-color-container': true
            'selected': @state.isPickerVisible
          style: {backgroundColor: 'white'}
        },
        (div {className: 'color-well-checker color-well-checker-top-left'}),
        (div {
          className: 'color-well-checker color-well-checker-bottom-right',
          style: {left: '50%', top: '50%'}
        }),
        (div \
          {
            className: 'color-well-color',
            style: {backgroundColor: @state.color}
          },
          " "
        ),
      ),
      @renderPicker()
    )

  renderPicker: ->
    {div} = React.DOM
    return null unless @state.isPickerVisible

    renderTransparentCell = =>
      (div \
        {className: 'color-row', key: 0, style: {height: 20}},
        (div \
          {
            className: classSet(
              'color-cell transparent-cell': true,
              'selected': @state.color == 'transparent'
            )
            onClick: => @setColor('transparent')
          },
          'transparent'
        )
      )

    rows = []
    rows.push ("hsla(0, 0%, #{i}%, #{@state.alpha})" for i in [0..100] by 10)
    for hue in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      rows.push("hsla(#{hue}, 100%, #{i}%, #{@state.alpha})" for i in [10..90] by 8)

    (div {className: 'color-picker-popup'},
      renderTransparentCell(),
      (Slider {
        initialValue: @state.alpha,
        onChange: (newValue) => @setState({alpha: newValue})}),
      rows.map((row, ix) =>
        return (div \
          {className: 'color-row', key: ix, style: {width: 20 * row.length}},
          row.map((cellColor, ix2) =>
            className = classSet
              'color-cell': true
              'selected': @state.color == cellColor
            (div \
              {
                className,
                onClick: => @setColor(cellColor)
                style: {backgroundColor: cellColor}
                key: ix2
              }
            )
          )
        )
      )
    )


module.exports = ColorWell