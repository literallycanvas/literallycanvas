$(document).ready ->
  $('.literally').literallycanvas()

  $(document).bind 'touchmove', (e) ->
    if e.target == document.documentElement
        e.preventDefault()

  oldConsole = console
  window.console = {
    log: (args...) ->
      oldConsole.log(args...)
      $('.log').append($("
        <div class='log-line'>#{args}</div>
      "))
  }
