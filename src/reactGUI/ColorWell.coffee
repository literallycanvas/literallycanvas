React = require './React-shim'
{classSet} = require '../core/util'


getPosition = (element) =>
  x = 0
  y = 0
  while element
    x += (element.offsetLeft - element.scrollLeft + element.clientLeft)
    y += (element.offsetTop - element.scrollTop + element.clientTop)
    element = element.offsetParent
  {x, y}


parseHSLAString = (s) ->
  return null unless s.substring(0, 4) == 'hsla'
  firstParen = s.indexOf('(')
  lastParen = s.indexOf(')')
  insideParens = s.substring(firstParen + 1, lastParen - firstParen + 4)
  components = (s.trim() for s in insideParens.split(','))
  return {
    hue: parseInt(components[0], 10)
    sat: parseInt(components[1].substring(0, components[1].length - 1), 10)
    light: parseInt(components[2].substring(0, components[2].length - 1), 10)
    alpha: parseFloat(components[3])
  }


getHSLAString = ({hue, sat, light, alpha}) ->
  "hsla(#{hue}, #{sat}%, #{light}%, #{alpha})"
getHSLString = ({hue, sat, light}) ->
  "hsl(#{hue}, #{sat}%, #{light}%)"


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
    hsla: null
  }

  # our color state tracks lc's
  componentDidMount: ->
    @unsubscribe = @props.lc.on "#{@props.colorName}ColorChange", =>
      @setState {color: @props.lc.colors[@props.colorName]}
  componentWillUnmount: -> @unsubscribe()

  updateHSLA: (c) ->
    if c == 'transparent'
      hsla = {hue: 0, sat: 0, light: 0, alpha: 0}
    else
      hsla = parseHSLAString(c)
    alpha = hsla.alpha or @state.alpha
    @setState({hsla, alpha})

  closePicker: -> @setState({isPickerVisible: false})
  togglePicker: ->
    @setState({isPickerVisible: not @state.isPickerVisible})
    @updateHSLA(@state.color)

  setColor: (c) ->
    @setState({color: c})
    @updateHSLA(c)
    @props.lc.setColor(@props.colorName, c)

  setAlpha: (alpha) ->
    @setState({alpha})
    if @state.hsla
      hsla = @state.hsla
      hsla.alpha = alpha
      @setState({hsla})
      @setColor(getHSLAString(hsla))

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
    rows.push ({hue: 0, sat: 0, light: i, alpha: @state.alpha} for i in [0..100] by 10)
    for hue in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      rows.push ({hue, sat: 100, light: i, alpha: @state.alpha} for i in [10..90] by 8)

    (div {className: 'color-picker-popup'},
      renderTransparentCell(),
      (Slider {
        initialValue: @state.alpha,
        onChange: (newValue) => @setAlpha(newValue)
      }),
      rows.map((row, ix) =>
        return (div \
          {
            className: 'color-row',
            key: ix,
            style: {width: 20 * row.length, opacity: @state.alpha}
          },
          row.map((cellColor, ix2) =>
            {hue, sat, light, alpha} = cellColor
            colorString = getHSLAString(cellColor)
            colorStringNoAlpha = "hsl(#{hue}, #{sat}%, #{light}%)"
            className = classSet
              'color-cell': true
              'selected': @state.color == colorString
            (div \
              {
                className,
                onClick: (e) =>
                  @setColor(colorString)
                  e.stopPropagation()
                style: {backgroundColor: colorStringNoAlpha}
                key: ix2
              }
            )
          )
        )
      )
    )


module.exports = ColorWell