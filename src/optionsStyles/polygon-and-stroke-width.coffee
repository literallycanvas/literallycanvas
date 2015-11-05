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

    unsubscribeFuncs.push lc.on 'lc-polygon-started', showPolygonTools
    unsubscribeFuncs.push lc.on 'lc-polygon-stopped', hidePolygonTools

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
      (div {className: 'square-toolbar-button', onClick: polygonFinishOpen, style: polygonToolStyle},
        img {src: "#{@props.imageURLPrefix}/polygon-open.png"}),
      (div {className: 'square-toolbar-button', onClick: polygonFinishClosed, style: polygonToolStyle},
        img {src: "#{@props.imageURLPrefix}/polygon-closed.png"}),
      (div {className: 'square-toolbar-button', onClick: polygonCancel, style: polygonToolStyle},
        img {src: "#{@props.imageURLPrefix}/polygon-cancel.png"}),
      (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})


module.exports = {}
