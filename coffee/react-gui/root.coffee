window.LC = LC or {}
LC.React = LC.React or {}


LC.React.init = (rootElement) ->
  canvasElement = null
  for child in rootElement.children
    if child.tagName.toLocaleLowerCase() == 'canvas'
      canvasElement = child

  unless canvasElement
    canvasElement = document.createElement('canvas')
    rootElement.appendChild(canvasElement)

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'
  rootElement.insertBefore(pickerElement, canvasElement)

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'
  rootElement.appendChild(optionsElement)