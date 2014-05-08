React = require './React-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'

createUndoRedoButtonComponent = (undoOrRedo) -> React.createClass
  displayName: if undoOrRedo == 'undo' then 'UndoButton' else 'RedoButton'

  # We do this a lot, even though it reads as a React no-no.
  # The reason is that '@props.lc' is a monolithic state bucket for
  # Literally Canvas, and does not offer opportunities for encapsulation.
  #
  # However, this component really does read and write only to the 'undo'
  # part of the state bucket, and we have to get react to update somehow, and
  # we don't want the parent to have to worry about this, so it's in @state.
  getState: -> {
    isEnabled: switch
      when undoOrRedo == 'undo' then @props.lc.canUndo()
      when undoOrRedo == 'redo' then @props.lc.canRedo()
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('drawingChange')]

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = "lc-#{undoOrRedo} " + React.addons.classSet
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = switch
      when !@state.isEnabled then ->
      when undoOrRedo == 'undo' then -> lc.undo()
      when undoOrRedo == 'redo' then -> lc.redo()

    (div {className, onClick, dangerouslySetInnerHTML: {
      __html: if undoOrRedo == 'undo' then "&larr;" else "&rarr;"}})


UndoButton = createUndoRedoButtonComponent('undo')
RedoButton = createUndoRedoButtonComponent('redo')
UndoRedoButtons = React.createClass
  displayName: 'UndoRedoButtons'
  render: ->
    {div} = React.DOM
    {lc} = @props
    (div {className: 'lc-undo-redo'}, UndoButton({lc}), RedoButton({lc}))

module.exports = UndoRedoButtons