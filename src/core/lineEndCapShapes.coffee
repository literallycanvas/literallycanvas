module.exports =
  arrow: (ctx, x, y, angle, opts={}) ->
    opts.width ?= Math.max(ctx.lineWidth * 2.2, 5)
    opts.length ?= opts.width
    opts.color ?= ctx.strokeStyle

    ctx.fillStyle = opts.color
    ctx.lineWidth = 0
    ctx.strokeStyle = 'transparent'
    ctx.beginPath()
    ctx.moveTo(
      x + Math.cos(angle + Math.PI / 2) * opts.width / 2,
      y + Math.sin(angle + Math.PI / 2) * opts.width / 2,
    )
    ctx.lineTo(
      x + Math.cos(angle) * opts.length,
      y + Math.sin(angle) * opts.length,
    )
    ctx.lineTo(
      x + Math.cos(angle - Math.PI / 2) * opts.width / 2,
      y + Math.sin(angle - Math.PI / 2) * opts.width / 2,
    )
    ctx.fill()