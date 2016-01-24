React = require '../reactGUI/React-shim'
{defineOptionsStyle} = require './optionsStyles'
StrokeWidthPicker = React.createFactory require '../reactGUI/StrokeWidthPicker'
createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'

defineOptionsStyle 'polygon-and-stroke-width', React.createClass
  displayName: 'PolygonAndStrokeWidth'
  getState: -> {
    strokeWidth: @props.tool.strokeWidth
    inProgress: false
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  componentDidMount: ->
    unsubscribeFuncs = []
    @unsubscribe = =>
      for func in unsubscribeFuncs
        func()

    showPolygonTools = () =>
      @setState({ inProgress: true }) unless @state.inProgress;

    hidePolygonTools = () =>
      @setState({ inProgress: false });

    unsubscribeFuncs.push @props.lc.on 'lc-polygon-started', showPolygonTools
    unsubscribeFuncs.push @props.lc.on 'lc-polygon-stopped', hidePolygonTools

  componentWillUnmount: ->
    @unsubscribe()

  render: ->
    lc = @props.lc
    {div, img} = React.DOM

    polygonFinishOpen = () =>
      lc.trigger 'lc-polygon-finishopen'

    polygonFinishClosed = () =>
      lc.trigger 'lc-polygon-finishclosed'

    polygonCancel = () =>
      lc.trigger 'lc-polygon-cancel'

    polygonToolStyle = {}
    polygonToolStyle = {display: 'none'} unless @state.inProgress

    div {},
      div {className: 'polygon-toolbar horz-toolbar', style: polygonToolStyle},
        (div {className: 'square-toolbar-button', onClick: polygonFinishOpen},
          img {src: "#{@props.imageURLPrefix}/polygon-open.png"}),
        (div {className: 'square-toolbar-button', onClick: polygonFinishClosed},
          img {src: "#{@props.imageURLPrefix}/polygon-closed.png"}),
        (div {className: 'square-toolbar-button', onClick: polygonCancel},
          img {src: "#{@props.imageURLPrefix}/polygon-cancel.png"}),
      div {},
        (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})


module.exports = {}
