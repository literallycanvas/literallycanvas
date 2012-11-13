$(document).ready ->
  $('.literally').literallycanvas()

  $(document).bind 'touchmove', (e) ->
    if e.target == document.documentElement
        e.preventDefault()
