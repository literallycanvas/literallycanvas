window.LC = LC or {}
LC.React = LC.React or {}


LC.React.init = (root, lc, toolNames, imageURLPrefix) ->
  canvasElement = null
  for child in root.children
    if child.tagName.toLocaleLowerCase() == 'canvas'
      canvasElement = child

  unless canvasElement
    canvasElement = document.createElement('canvas')
    root.appendChild(canvasElement)

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'
  root.insertBefore(pickerElement, canvasElement)

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'
  root.appendChild(optionsElement)

  React.renderComponent(
    LC.React.Picker({lc, root, toolNames, imageURLPrefix}),
    pickerElement);
  React.renderComponent(LC.React.Options({lc, root}), optionsElement);
