React = require './React-shim'
PureRenderMixin = require 'react-addons-pure-render-mixin'
{classSet, requestAnimationFrame, cancelAnimationFrame} = require '../core/util'


parseHSLAString = (s) ->
  return {hue: 0, sat: 0, light: 0, alpha: 0} if s == 'transparent'
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


ColorGrid = React.createFactory React.createClass
  displayName: 'ColorGrid'
  mixins: [PureRenderMixin]
  render: ->
    {div} = React.DOM
    (div {},
      @props.rows.map((row, ix) =>
        return (div \
          {
            className: 'color-row',
            key: ix,
            style: {width: 20 * row.length}
          },
          row.map((cellColor, ix2) =>
            {hue, sat, light, alpha} = cellColor
            colorString = getHSLAString(cellColor)
            colorStringNoAlpha = "hsl(#{hue}, #{sat}%, #{light}%)"
            className = classSet
              'color-cell': true
              'selected': @props.selectedColor == colorString
            update = (e) =>
              @props.onChange(cellColor, colorString)
              e.stopPropagation()
              e.preventDefault()
            (div \
              {
                className,
                onTouchStart: update
                onTouchMove: update
                onClick: update
                style: {backgroundColor: colorStringNoAlpha}
                key: ix2
              }
            )
          )
        )
      )
    )


ColorWell = React.createClass
  displayName: 'ColorWell'
  mixins: [PureRenderMixin]
  getInitialState: ->
    colorString = @props.lc.colors[@props.colorName]
    hsla = parseHSLAString(colorString)
    hsla ?= {}
    hsla.alpha ?= 1
    hsla.sat ?= 100
    hsla.hue ?= 0
    hsla.light ?= 50

    {
      colorString,
      alpha: hsla.alpha
      sat: if hsla.sat == 0 then 100 else hsla.sat
      isPickerVisible: false,
      hsla: hsla
    }

  # our color state tracks lc's
  componentDidMount: ->
    @unsubscribe = @props.lc.on "#{@props.colorName}ColorChange", =>
      colorString = @props.lc.colors[@props.colorName]
      @setState({colorString})
      @setHSLAFromColorString(colorString)
  componentWillUnmount: -> @unsubscribe()

  setHSLAFromColorString: (c) ->
    hsla = parseHSLAString(c)
    if hsla
      @setState({hsla, alpha: hsla.alpha, sat: hsla.sat})
    else
      @setState({hsla: null, alpha: 1, sat: 100})

  closePicker: -> @setState({isPickerVisible: false})
  togglePicker: ->
    isPickerVisible = not @state.isPickerVisible
    shouldResetSat = isPickerVisible && @state.sat == 0
    @setHSLAFromColorString(@state.colorString)
    @setState({isPickerVisible, sat: if shouldResetSat then 100 else @state.sat})

  setColor: (c) ->
    @setState({colorString: c})
    @setHSLAFromColorString(c)
    @props.lc.setColor(@props.colorName, c)

  setAlpha: (alpha) ->
    @setState({alpha})
    if @state.hsla
      hsla = @state.hsla
      hsla.alpha = alpha
      @setState({hsla})
      @setColor(getHSLAString(hsla))

  setSat: (sat) ->
    @setState({sat})
    throw "SAT" if isNaN(sat)
    if @state.hsla
      hsla = @state.hsla
      hsla.sat = sat
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
          onClick: @togglePicker
        },
        (div {className: 'color-well-checker color-well-checker-top-left'}),
        (div {
          className: 'color-well-checker color-well-checker-bottom-right',
          style: {left: '50%', top: '50%'}
        }),
        (div \
          {
            className: 'color-well-color',
            style: {backgroundColor: @state.colorString}
          },
          " "
        ),
      ),
      @renderPicker()
    )

  renderPicker: ->
    {div, label, input} = React.DOM
    return null unless @state.isPickerVisible

    renderLabel = (text) =>
      (div {
        className: 'color-row label', key: text, style: {
          lineHeight: '20px'
          height: 16
        }
      }, text)

    renderColor = =>
      checkerboardURL = "#{@props.lc.opts.imageURLPrefix}/checkerboard-8x8.png"
      (div {
        className: 'color-row', key: "color", style: {
          position: 'relative'
          backgroundImage: "url(#{checkerboardURL})"
          backgroundRepeat: 'repeat'
          height: 24
        }},
        (div {style: {
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0
          backgroundColor: @state.colorString
        }})
      )

    rows = []
    rows.push ({hue: 0, sat: 0, light: i, alpha: @state.alpha} for i in [0..100] by 10)
    for hue in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      rows.push ({hue, sat: @state.sat, light: i, alpha: @state.alpha} for i in [10..90] by 8)

    onSelectColor = (hsla, s) => @setColor(s)

    (div {className: 'color-picker-popup'},
      renderColor()
      renderLabel("alpha")
      (input {
        type: 'range',
        min: 0, max: 1, step: 0.01
        value: @state.alpha,
        onChange: (e) => @setAlpha(parseFloat(e.target.value))
      }),
      renderLabel("saturation")
      (input {
        type: 'range',
        min: 0, max: 100,
        value: @state.sat, max: 100,
        onChange: (e) => @setSat(parseInt(e.target.value, 10))
      }),
      (ColorGrid {rows, selectedColor: @state.colorString, onChange: onSelectColor})
    )


module.exports = ColorWell