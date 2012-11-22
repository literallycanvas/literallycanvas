# ========================================================
# bootstrap-colorpicker.js 
# http://www.eyecon.ro/bootstrap-colorpicker
# =========================================================
# Copyright 2012 Stefan Petre
# Heavy modifications by Stephen Johnson
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ========================================================= 
size = 200


positionForEvent = (e) ->
  if typeof e.pageX == "undefined"
    if typeof e.originalEvent == "undefined"
      return null
    return e.originalEvent.changedTouches[0]
  else
    return e


class Color
  constructor: (val) ->
    @value =
      h: 1
      s: 1
      b: 1
      a: 1

    @setColor val

  #parse a string to HSB
  setColor: (val) ->
    val = val.toLowerCase()
    that = this
    $.each CPGlobal.stringParsers, (i, parser) ->
      match = parser.re.exec(val)
      values = match and parser.parse(match)
      space = parser.space or "rgba"
      if values
        if space is "hsla"
          that.value = CPGlobal.RGBtoHSB.apply(null, CPGlobal.HSLtoRGB.apply(null, values))
        else
          that.value = CPGlobal.RGBtoHSB.apply(null, values)
        false


  setHue: (h) ->
    @value.h = 1 - h

  setSaturation: (s) ->
    @value.s = s

  setLightness: (b) ->
    @value.b = 1 - b

  setAlpha: (a) ->
    @value.a = parseInt((1 - a) * 100, 10) / 100
  
  # HSBtoRGB from RaphaelJS
  # https://github.com/DmitryBaranovskiy/raphael/
  toRGB: (h, s, b, a) ->
    unless h
      h = @value.h
      s = @value.s
      b = @value.b
    h *= 360
    R = undefined
    G = undefined
    B = undefined
    X = undefined
    C = undefined
    h = (h % 360) / 60
    C = b * s
    X = C * (1 - Math.abs(h % 2 - 1))
    R = G = B = b - C
    h = ~~h
    R += [C, X, 0, 0, X, C][h]
    G += [X, C, C, X, 0, 0][h]
    B += [0, 0, X, C, C, X][h]
    r: Math.round(R * 255)
    g: Math.round(G * 255)
    b: Math.round(B * 255)
    a: a or @value.a

  toHex: (h, s, b, a) ->
    rgb = @toRGB(h, s, b, a)
    r = parseInt(rgb.r, 10) << 16
    g = parseInt(rgb.g, 10) << 8
    b = parseInt(rgb.b, 10)
    return "#" + ((1 << 24) | r | g | b).toString(16).substr(1)

  toHSL: (h, s, b, a) ->
    unless h
      h = @value.h
      s = @value.s
      b = @value.b
    H = h
    L = (2 - s) * b
    S = s * b
    if L > 0 and L <= 1
      S /= L
    else
      S /= 2 - L
    L /= 2
    S = 1  if S > 1
    h: H
    s: S
    l: L
    a: a or @value.a


class Colorpicker
  constructor: (element, options) ->
    @element = $(element)
    format = options.format or @element.data("color-format") or "hex"
    @format = CPGlobal.translateFormats[format]
    @isInput = @element.is("input")
    @component = (if @element.is(".color") then @element.find(".add-on") else false)
    @picker = $(CPGlobal.template).appendTo("body")
    @picker.on("mousedown", $.proxy(@mousedown, this))
    @picker.on("touchstart", $.proxy(@mousedown, this))
    if @isInput
      @element.on
        focus: $.proxy(@show, this)
        keyup: $.proxy(@update, this)

    if format is "rgba" or format is "hsla"
      @picker.addClass "alpha"
      @alpha = @picker.find(".colorpicker-alpha")[0].style
    if @component
      @picker.find(".colorpicker-color").hide()
      @preview = @element.find("i")[0].style
    else
      @preview = @picker.find("div:last")[0].style
    @base = @picker.find("div:first")[0].style
    @update()

  show: (e) ->
    @picker.show()
    @height = (if @component then @component.outerHeight() else @element.outerHeight())
    @place()
    $(window).on "resize", $.proxy(@place, this)
    unless @isInput
      if e
        e.stopPropagation()
        e.preventDefault()
    @element.trigger
      type: "show"
      color: @color


  update: ->
    @color = new Color((if @isInput then @element.prop("value") else @element.data("color")))
    @picker.find("i").eq(0).css(
      left: @color.value.s * size
      top: size - @color.value.b * size
    ).end().eq(1).css("top", size * (1 - @color.value.h)).end().eq(2).css "top", size * (1 - @color.value.a)
    @previewColor()

  setValue: (newColor) ->
    @color = new Color(newColor)
    @picker.find("i").eq(0).css(
      left: @color.value.s * size
      top: size - @color.value.b * size
    ).end().eq(1).css("top", size * (1 - @color.value.h)).end().eq(2).css "top", size * (1 - @color.value.a)
    @previewColor()
    @element.trigger
      type: "changeColor"
      color: @color


  hide: ->
    @picker.hide()
    $(window).off "resize", @place
    unless @isInput
      @element.find("input").prop "value", @format.call(this)  if @component
      @element.data "color", @format.call(this)
    else
      @element.prop "value", @format.call(this)
    @element.trigger
      type: "hide"
      color: @color


  place: ->
    thing = (if @component then @component else @element)
    offset = thing.offset()
    @picker.css
      top: offset.top - (thing.height() + @picker.height())
      left: offset.left


  
  #preview color change
  previewColor: ->
    try
      @preview.backgroundColor = @format.call(this)
    catch e
      @preview.backgroundColor = @color.toHex()
    
    #set the color for brightness/saturation slider
    @base.backgroundColor = @color.toHex(@color.value.h, 1, 1, 1)
    
    #set te color for alpha slider
    @alpha.backgroundColor = @color.toHex()  if @alpha

  pointer: null
  slider: null

  mousedown: (e) ->
    e.stopPropagation()
    e.preventDefault()
    target = $(e.target)

    #detect the slider and set the limits and callbacks
    zone = target.closest("div")
    unless zone.is(".colorpicker")
      if zone.is(".colorpicker-saturation")
        @slider = $.extend({}, CPGlobal.sliders.saturation)
      else if zone.is(".colorpicker-hue")
        @slider = $.extend({}, CPGlobal.sliders.hue)
      else if zone.is(".colorpicker-alpha")
        @slider = $.extend({}, CPGlobal.sliders.alpha)
      else
        return false
      offset = zone.offset()

      p = positionForEvent(e)

      #reference to knob's style
      @slider.knob = zone.find("i")[0].style
      @slider.left = p.pageX - offset.left
      @slider.top = p.pageY - offset.top
      @pointer =
        left: p.pageX
        top: p.pageY

      #trigger mousemove to move the knob to the current position
      $(@picker).on(
        mousemove: $.proxy(@mousemove, this)
        mouseup: $.proxy(@mouseup, this)
        touchmove: $.proxy(@mousemove, this)
        touchend: $.proxy(@mouseup, this)
        touchcancel: $.proxy(@mouseup, this)
      ).trigger "mousemove"
    false

  mousemove: (e) ->
    e.stopPropagation()
    e.preventDefault()

    p = positionForEvent(e)
    x = if p then p.pageX else @pointer.left
    y = if p then p.pageY else @pointer.top

    left = Math.max(
      0,
      Math.min(
        @slider.maxLeft,
        @slider.left + (x - @pointer.left)
      )
    )

    top = Math.max(
      0,
      Math.min(
        @slider.maxTop,
        @slider.top + (y - @pointer.top)
      )
    )

    @slider.knob.left = left + "px"
    @slider.knob.top = top + "px"
    @color[@slider.callLeft].call @color, left / size  if @slider.callLeft
    @color[@slider.callTop].call @color, top / size  if @slider.callTop
    @previewColor()
    @element.trigger
      type: "changeColor"
      color: @color

    false

  mouseup: (e) ->
    e.stopPropagation()
    e.preventDefault()
    $(@picker).off
      mousemove: @mousemove
      mouseup: @mouseup

    false

$.fn.colorpicker = (option) ->
  @each ->
    $this = $(this)
    data = $this.data("colorpicker")
    options = typeof option is "object" and option
    $this.data "colorpicker", (data = new Colorpicker(this, $.extend({}, $.fn.colorpicker.defaults, options)))  unless data
    data[option]()  if typeof option is "string"


$.fn.colorpicker.defaults = {}
$.fn.colorpicker.Constructor = Colorpicker
CPGlobal =
  
  # translate a format from Color object to a string
  translateFormats:
    rgb: ->
      rgb = @color.toRGB()
      "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")"

    rgba: ->
      rgb = @color.toRGB()
      "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a + ")"

    hsl: ->
      hsl = @color.toHSL()
      "hsl(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%)"

    hsla: ->
      hsl = @color.toHSL()
      "hsla(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%," + hsl.a + ")"

    hex: ->
      @color.toHex()

  sliders:
    saturation:
      maxLeft: size
      maxTop: size
      callLeft: "setSaturation"
      callTop: "setLightness"

    hue:
      maxLeft: 0
      maxTop: size
      callLeft: false
      callTop: "setHue"

    alpha:
      maxLeft: 0
      maxTop: size
      callLeft: false
      callTop: "setAlpha"

  
  # HSBtoRGB from RaphaelJS
  # https://github.com/DmitryBaranovskiy/raphael/
  RGBtoHSB: (r, g, b, a) ->
    r /= 255
    g /= 255
    b /= 255
    H = undefined
    S = undefined
    V = undefined
    C = undefined
    V = Math.max(r, g, b)
    C = V - Math.min(r, g, b)
    H = ((if C is 0 then null else (if V is r then (g - b) / C else (if V is g then (b - r) / C + 2 else (r - g) / C + 4))))
    H = ((H + 360) % 6) * 60 / 360
    S = (if C is 0 then 0 else C / V)
    h: H or 1
    s: S
    b: V
    a: a or 1

  HueToRGB: (p, q, h) ->
    if h < 0
      h += 1
    else h -= 1  if h > 1
    if (h * 6) < 1
      p + (q - p) * h * 6
    else if (h * 2) < 1
      q
    else if (h * 3) < 2
      p + (q - p) * ((2 / 3) - h) * 6
    else
      p

  HSLtoRGB: (h, s, l, a) ->
    s = 0  if s < 0
    q = undefined
    if l <= 0.5
      q = l * (1 + s)
    else
      q = l + s - (l * s)
    p = 2 * l - q
    tr = h + (1 / 3)
    tg = h
    tb = h - (1 / 3)
    r = Math.round(CPGlobal.HueToRGB(p, q, tr) * 255)
    g = Math.round(CPGlobal.HueToRGB(p, q, tg) * 255)
    b = Math.round(CPGlobal.HueToRGB(p, q, tb) * 255)
    [r, g, b, a or 1]

  
  # a set of RE's that can match strings and generate color tuples.
  # from John Resig color plugin
  # https://github.com/jquery/jquery-color/
  stringParsers: [
    re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/
    parse: (execResult) ->
      [execResult[1], execResult[2], execResult[3], execResult[4]]
  ,
    re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/
    parse: (execResult) ->
      [2.55 * execResult[1], 2.55 * execResult[2], 2.55 * execResult[3], execResult[4]]
  ,
    re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/
    parse: (execResult) ->
      [parseInt(execResult[1], 16), parseInt(execResult[2], 16), parseInt(execResult[3], 16)]
  ,
    re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/
    parse: (execResult) ->
      [parseInt(execResult[1] + execResult[1], 16), parseInt(execResult[2] + execResult[2], 16), parseInt(execResult[3] + execResult[3], 16)]
  ,
    re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/
    space: "hsla"
    parse: (execResult) ->
      [execResult[1] / 360, execResult[2] / 100, execResult[3] / 100, execResult[4]]
  ]
  template: "<div class=\"colorpicker\">" + "<div class=\"colorpicker-saturation\"><i><b></b></i></div>" + "<div class=\"colorpicker-hue\"><i></i></div>" + "<div class=\"colorpicker-alpha\"><i></i></div>" + "<div class=\"colorpicker-color\"><div /></div>" + "</div>"
