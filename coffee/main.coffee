class LiterallyCanvas

  constructor: (@canvas) ->
    @ctx = @canvas.getContext('2d')

  test: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)


$.fn.literallycanvas = ->
  lc = new LiterallyCanvas(@find('canvas').get(0))
  @click (e) =>
    @find('canvas').css('background-color', 'red')
    lc.test()
