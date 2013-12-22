(function() {
    var CPGlobal, Color, Colorpicker, positionForEvent, size;
    size = 200;
    positionForEvent = function(e) {
        if (typeof e.pageX === "undefined") {
            if (typeof e.originalEvent === "undefined") return null;
            return e.originalEvent.changedTouches[0];
        } else {
            return e;
        }
    };
    Color = function() {
        function Color(val) {
            this.value = {
                h: 1,
                s: 1,
                b: 1,
                a: 1
            };
            this.setColor(val);
        }
        Color.prototype.setColor = function(val) {
            var that;
            val = val.toLowerCase();
            that = this;
            return $.each(CPGlobal.stringParsers, function(i, parser) {
                var match, space, values;
                match = parser.re.exec(val);
                values = match && parser.parse(match);
                space = parser.space || "rgba";
                if (values) {
                    if (space === "hsla") {
                        that.value = CPGlobal.RGBtoHSB.apply(null, CPGlobal.HSLtoRGB.apply(null, values));
                    } else {
                        that.value = CPGlobal.RGBtoHSB.apply(null, values);
                    }
                    return false;
                }
            });
        };
        Color.prototype.setHue = function(h) {
            return this.value.h = 1 - h;
        };
        Color.prototype.setSaturation = function(s) {
            return this.value.s = s;
        };
        Color.prototype.setLightness = function(b) {
            return this.value.b = 1 - b;
        };
        Color.prototype.setAlpha = function(a) {
            return this.value.a = parseInt((1 - a) * 100, 10) / 100;
        };
        Color.prototype.toRGB = function(h, s, b, a) {
            var B, C, G, R, X;
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            h *= 360;
            R = void 0;
            G = void 0;
            B = void 0;
            X = void 0;
            C = void 0;
            h = h % 360 / 60;
            C = b * s;
            X = C * (1 - Math.abs(h % 2 - 1));
            R = G = B = b - C;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return {
                r: Math.round(R * 255),
                g: Math.round(G * 255),
                b: Math.round(B * 255),
                a: a || this.value.a
            };
        };
        Color.prototype.toHex = function(h, s, b, a) {
            var g, r, rgb;
            rgb = this.toRGB(h, s, b, a);
            r = parseInt(rgb.r, 10) << 16;
            g = parseInt(rgb.g, 10) << 8;
            b = parseInt(rgb.b, 10);
            return "#" + (1 << 24 | r | g | b).toString(16).substr(1);
        };
        Color.prototype.toHSL = function(h, s, b, a) {
            var H, L, S;
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            H = h;
            L = (2 - s) * b;
            S = s * b;
            if (L > 0 && L <= 1) {
                S /= L;
            } else {
                S /= 2 - L;
            }
            L /= 2;
            if (S > 1) S = 1;
            return {
                h: H,
                s: S,
                l: L,
                a: a || this.value.a
            };
        };
        return Color;
    }();
    Colorpicker = function() {
        function Colorpicker(element, options) {
            var format;
            this.element = $(element);
            format = options.format || this.element.data("color-format") || "hex";
            this.format = CPGlobal.translateFormats[format];
            this.isInput = this.element.is("input");
            this.component = this.element.is(".color") ? this.element.find(".add-on") : false;
            this.picker = $(CPGlobal.template).appendTo("body");
            this.picker.on("mousedown", $.proxy(this.mousedown, this));
            this.picker.on("touchstart", $.proxy(this.mousedown, this));
            if (this.isInput) {
                this.element.on({
                    focus: $.proxy(this.show, this),
                    keyup: $.proxy(this.update, this)
                });
            }
            if (format === "rgba" || format === "hsla") {
                this.picker.addClass("alpha");
                this.alpha = this.picker.find(".colorpicker-alpha")[0].style;
            }
            if (this.component) {
                this.picker.find(".colorpicker-color").hide();
                this.preview = this.element.find("i")[0].style;
            } else {
                this.preview = this.picker.find("div:last")[0].style;
            }
            this.base = this.picker.find("div:first")[0].style;
            this.update();
        }
        Colorpicker.prototype.show = function(e) {
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.place();
            $(window).on("resize", $.proxy(this.place, this));
            if (!this.isInput) {
                if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
            return this.element.trigger({
                type: "show",
                color: this.color
            });
        };
        Colorpicker.prototype.update = function() {
            this.color = new Color(this.isInput ? this.element.prop("value") : this.element.data("color"));
            this.picker.find("i").eq(0).css({
                left: this.color.value.s * size,
                top: size - this.color.value.b * size
            }).end().eq(1).css("top", size * (1 - this.color.value.h)).end().eq(2).css("top", size * (1 - this.color.value.a));
            return this.previewColor();
        };
        Colorpicker.prototype.setValue = function(newColor) {
            this.color = new Color(newColor);
            this.picker.find("i").eq(0).css({
                left: this.color.value.s * size,
                top: size - this.color.value.b * size
            }).end().eq(1).css("top", size * (1 - this.color.value.h)).end().eq(2).css("top", size * (1 - this.color.value.a));
            this.previewColor();
            return this.element.trigger({
                type: "changeColor",
                color: this.color
            });
        };
        Colorpicker.prototype.hide = function() {
            this.picker.hide();
            $(window).off("resize", this.place);
            if (!this.isInput) {
                if (this.component) {
                    this.element.find("input").prop("value", this.format.call(this));
                }
                this.element.data("color", this.format.call(this));
            } else {
                this.element.prop("value", this.format.call(this));
            }
            return this.element.trigger({
                type: "hide",
                color: this.color
            });
        };
        Colorpicker.prototype.place = function() {
            var offset, thing;
            thing = this.component ? this.component : this.element;
            offset = thing.offset();
            return this.picker.css({
                top: offset.top - (thing.height() + this.picker.height()),
                left: offset.left
            });
        };
        Colorpicker.prototype.previewColor = function() {
            try {
                this.preview.backgroundColor = this.format.call(this);
            } catch (e) {
                this.preview.backgroundColor = this.color.toHex();
            }
            this.base.backgroundColor = this.color.toHex(this.color.value.h, 1, 1, 1);
            if (this.alpha) return this.alpha.backgroundColor = this.color.toHex();
        };
        Colorpicker.prototype.pointer = null;
        Colorpicker.prototype.slider = null;
        Colorpicker.prototype.mousedown = function(e) {
            var offset, p, target, zone;
            e.stopPropagation();
            e.preventDefault();
            target = $(e.target);
            zone = target.closest("div");
            if (!zone.is(".colorpicker")) {
                if (zone.is(".colorpicker-saturation")) {
                    this.slider = $.extend({}, CPGlobal.sliders.saturation);
                } else if (zone.is(".colorpicker-hue")) {
                    this.slider = $.extend({}, CPGlobal.sliders.hue);
                } else if (zone.is(".colorpicker-alpha")) {
                    this.slider = $.extend({}, CPGlobal.sliders.alpha);
                } else {
                    return false;
                }
                offset = zone.offset();
                p = positionForEvent(e);
                this.slider.knob = zone.find("i")[0].style;
                this.slider.left = p.pageX - offset.left;
                this.slider.top = p.pageY - offset.top;
                this.pointer = {
                    left: p.pageX,
                    top: p.pageY
                };
                $(this.picker).on({
                    mousemove: $.proxy(this.mousemove, this),
                    mouseup: $.proxy(this.mouseup, this),
                    touchmove: $.proxy(this.mousemove, this),
                    touchend: $.proxy(this.mouseup, this),
                    touchcancel: $.proxy(this.mouseup, this)
                }).trigger("mousemove");
            }
            return false;
        };
        Colorpicker.prototype.mousemove = function(e) {
            var left, p, top, x, y;
            e.stopPropagation();
            e.preventDefault();
            p = positionForEvent(e);
            x = p ? p.pageX : this.pointer.left;
            y = p ? p.pageY : this.pointer.top;
            left = Math.max(0, Math.min(this.slider.maxLeft, this.slider.left + (x - this.pointer.left)));
            top = Math.max(0, Math.min(this.slider.maxTop, this.slider.top + (y - this.pointer.top)));
            this.slider.knob.left = left + "px";
            this.slider.knob.top = top + "px";
            if (this.slider.callLeft) {
                this.color[this.slider.callLeft].call(this.color, left / size);
            }
            if (this.slider.callTop) {
                this.color[this.slider.callTop].call(this.color, top / size);
            }
            this.previewColor();
            this.element.trigger({
                type: "changeColor",
                color: this.color
            });
            return false;
        };
        Colorpicker.prototype.mouseup = function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this.picker).off({
                mousemove: this.mousemove,
                mouseup: this.mouseup
            });
            return false;
        };
        return Colorpicker;
    }();
    $.fn.colorpicker = function(option) {
        return this.each(function() {
            var $this, data, options;
            $this = $(this);
            data = $this.data("colorpicker");
            options = typeof option === "object" && option;
            if (!data) {
                $this.data("colorpicker", data = new Colorpicker(this, $.extend({}, $.fn.colorpicker.defaults, options)));
            }
            if (typeof option === "string") return data[option]();
        });
    };
    $.fn.colorpicker.defaults = {};
    $.fn.colorpicker.Constructor = Colorpicker;
    CPGlobal = {
        translateFormats: {
            rgb: function() {
                var rgb;
                rgb = this.color.toRGB();
                return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
            },
            rgba: function() {
                var rgb;
                rgb = this.color.toRGB();
                return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a + ")";
            },
            hsl: function() {
                var hsl;
                hsl = this.color.toHSL();
                return "hsl(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%)";
            },
            hsla: function() {
                var hsl;
                hsl = this.color.toHSL();
                return "hsla(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%," + hsl.a + ")";
            },
            hex: function() {
                return this.color.toHex();
            }
        },
        sliders: {
            saturation: {
                maxLeft: size,
                maxTop: size,
                callLeft: "setSaturation",
                callTop: "setLightness"
            },
            hue: {
                maxLeft: 0,
                maxTop: size,
                callLeft: false,
                callTop: "setHue"
            },
            alpha: {
                maxLeft: 0,
                maxTop: size,
                callLeft: false,
                callTop: "setAlpha"
            }
        },
        RGBtoHSB: function(r, g, b, a) {
            var C, H, S, V;
            r /= 255;
            g /= 255;
            b /= 255;
            H = void 0;
            S = void 0;
            V = void 0;
            C = void 0;
            V = Math.max(r, g, b);
            C = V - Math.min(r, g, b);
            H = C === 0 ? null : V === r ? (g - b) / C : V === g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            S = C === 0 ? 0 : C / V;
            return {
                h: H || 1,
                s: S,
                b: V,
                a: a || 1
            };
        },
        HueToRGB: function(p, q, h) {
            if (h < 0) {
                h += 1;
            } else {
                if (h > 1) h -= 1;
            }
            if (h * 6 < 1) {
                return p + (q - p) * h * 6;
            } else if (h * 2 < 1) {
                return q;
            } else if (h * 3 < 2) {
                return p + (q - p) * (2 / 3 - h) * 6;
            } else {
                return p;
            }
        },
        HSLtoRGB: function(h, s, l, a) {
            var b, g, p, q, r, tb, tg, tr;
            if (s < 0) s = 0;
            q = void 0;
            if (l <= .5) {
                q = l * (1 + s);
            } else {
                q = l + s - l * s;
            }
            p = 2 * l - q;
            tr = h + 1 / 3;
            tg = h;
            tb = h - 1 / 3;
            r = Math.round(CPGlobal.HueToRGB(p, q, tr) * 255);
            g = Math.round(CPGlobal.HueToRGB(p, q, tg) * 255);
            b = Math.round(CPGlobal.HueToRGB(p, q, tb) * 255);
            return [ r, g, b, a || 1 ];
        },
        stringParsers: [ {
            re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            parse: function(execResult) {
                return [ execResult[1], execResult[2], execResult[3], execResult[4] ];
            }
        }, {
            re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            parse: function(execResult) {
                return [ 2.55 * execResult[1], 2.55 * execResult[2], 2.55 * execResult[3], execResult[4] ];
            }
        }, {
            re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
            parse: function(execResult) {
                return [ parseInt(execResult[1], 16), parseInt(execResult[2], 16), parseInt(execResult[3], 16) ];
            }
        }, {
            re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
            parse: function(execResult) {
                return [ parseInt(execResult[1] + execResult[1], 16), parseInt(execResult[2] + execResult[2], 16), parseInt(execResult[3] + execResult[3], 16) ];
            }
        }, {
            re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            space: "hsla",
            parse: function(execResult) {
                return [ execResult[1] / 360, execResult[2] / 100, execResult[3] / 100, execResult[4] ];
            }
        } ],
        template: '<div class="colorpicker">\n  <div class="colorpicker-saturation">\n    <i>\n      <b></b>\n    </i>\n  </div>\n  <div class="colorpicker-hue">\n    <i></i>\n  </div>\n  <div class="colorpicker-alpha">\n    <i></i>\n  </div>\n  <div class="colorpicker-color">\n    <div></div>\n  </div>\n</div>"'
    };
}).call(this);

(function() {
    var _ref, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments);
        };
    };
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.LiterallyCanvas = function() {
        function LiterallyCanvas(canvas, opts) {
            var backgroundImage, _this = this;
            this.canvas = canvas;
            this.opts = opts;
            this.updateSize = __bind(this.updateSize, this);
            this.$canvas = $(this.canvas);
            LC.bindEvents(this, this.canvas, this.opts.keyboardShortcuts);
            this.colors = {
                primary: this.opts.primaryColor || "#000",
                secondary: this.opts.secondaryColor || "#fff",
                background: this.opts.backgroundColor || "transparent"
            };
            $(this.canvas).css("background-color", this.colors.background);
            this.watermarkImage = this.opts.watermarkImage;
            if (this.watermarkImage && !this.watermarkImage.complete) {
                this.watermarkImage.onload = function() {
                    return _this.repaint(true, false);
                };
            }
            this.buffer = $("<canvas>").get(0);
            this.ctx = this.canvas.getContext("2d");
            this.bufferCtx = this.buffer.getContext("2d");
            this.backgroundShapes = [];
            this.shapes = [];
            this.undoStack = [];
            this.redoStack = [];
            this.isDragging = false;
            this.position = {
                x: 0,
                y: 0
            };
            this.scale = 1;
            this.tool = void 0;
            if (this.opts.preserveCanvasContents) {
                backgroundImage = new Image();
                backgroundImage.src = this.canvas.toDataURL();
                backgroundImage.onload = function() {
                    return _this.repaint();
                };
                this.backgroundShapes.push(new LC.ImageShape(0, 0, backgroundImage));
            }
            this.backgroundShapes = this.backgroundShapes.concat(this.opts.backgroundShapes || []);
            this.repaint();
        }
        LiterallyCanvas.prototype.updateSize = function() {
            this.$canvas.attr("width", this.$canvas.width());
            this.$canvas.attr("height", this.$canvas.height());
            return this.repaint();
        };
        LiterallyCanvas.prototype.trigger = function(name, data) {
            return this.canvas.dispatchEvent(new CustomEvent(name, {
                detail: data
            }));
        };
        LiterallyCanvas.prototype.on = function(name, fn) {
            return this.canvas.addEventListener(name, function(e) {
                return fn(e.detail);
            });
        };
        LiterallyCanvas.prototype.clientCoordsToDrawingCoords = function(x, y) {
            return {
                x: (x - this.position.x) / this.scale,
                y: (y - this.position.y) / this.scale
            };
        };
        LiterallyCanvas.prototype.drawingCoordsToClientCoords = function(x, y) {
            return {
                x: x * this.scale + this.position.x,
                y: y * this.scale + this.position.y
            };
        };
        LiterallyCanvas.prototype.setTool = function(tool) {
            this.tool = tool;
            return this.trigger("toolChange", {
                tool: tool
            });
        };
        LiterallyCanvas.prototype.begin = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            this.tool.begin(newPos.x, newPos.y, this);
            this.isDragging = true;
            return this.trigger("drawStart", {
                tool: this.tool
            });
        };
        LiterallyCanvas.prototype["continue"] = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            if (this.isDragging) {
                this.tool["continue"](newPos.x, newPos.y, this);
                return this.trigger("drawContinue", {
                    tool: this.tool
                });
            }
        };
        LiterallyCanvas.prototype.end = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            if (this.isDragging) {
                this.tool.end(newPos.x, newPos.y, this);
                this.isDragging = false;
                return this.trigger("drawEnd", {
                    tool: this.tool
                });
            }
        };
        LiterallyCanvas.prototype.setColor = function(name, color) {
            this.colors[name] = color;
            $(this.canvas).css("background-color", this.colors.background);
            this.trigger("" + name + "ColorChange", this.colors[name]);
            return this.repaint();
        };
        LiterallyCanvas.prototype.getColor = function(name) {
            return this.colors[name];
        };
        LiterallyCanvas.prototype.saveShape = function(shape) {
            this.execute(new LC.AddShapeAction(this, shape));
            this.trigger("shapeSave", {
                shape: shape
            });
            return this.trigger("drawingChange", {
                shape: shape
            });
        };
        LiterallyCanvas.prototype.numShapes = function() {
            return this.shapes.length;
        };
        LiterallyCanvas.prototype.pan = function(x, y) {
            this.position.x = this.position.x - x;
            this.position.y = this.position.y - y;
            return this.trigger("pan", {
                x: this.position.x,
                y: this.position.y
            });
        };
        LiterallyCanvas.prototype.zoom = function(factor) {
            var oldScale;
            oldScale = this.scale;
            this.scale = this.scale + factor;
            this.scale = Math.max(this.scale, .6);
            this.scale = Math.min(this.scale, 4);
            this.scale = Math.round(this.scale * 100) / 100;
            this.position.x = LC.scalePositionScalar(this.position.x, this.canvas.width, oldScale, this.scale);
            this.position.y = LC.scalePositionScalar(this.position.y, this.canvas.height, oldScale, this.scale);
            this.repaint();
            return this.trigger("zoom", {
                oldScale: oldScale,
                newScale: this.scale
            });
        };
        LiterallyCanvas.prototype.repaint = function(dirty, drawBackground) {
            var retryCallback, _this = this;
            if (dirty == null) dirty = true;
            if (drawBackground == null) drawBackground = false;
            retryCallback = function() {
                return _this.repaint(true);
            };
            if (dirty) {
                this.buffer.width = this.canvas.width;
                this.buffer.height = this.canvas.height;
                this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
                if (drawBackground) {
                    this.bufferCtx.fillStyle = this.colors.background;
                    this.bufferCtx.fillRect(0, 0, this.buffer.width, this.buffer.height);
                }
                if (this.watermarkImage) {
                    this.bufferCtx.drawImage(this.watermarkImage, this.canvas.width / 2 - this.watermarkImage.width / 2, this.canvas.height / 2 - this.watermarkImage.height / 2);
                }
                this.draw(this.backgroundShapes, this.bufferCtx, retryCallback);
                this.draw(this.shapes, this.bufferCtx, retryCallback);
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                this.ctx.drawImage(this.buffer, 0, 0);
            }
            return this.trigger("repaint", null);
        };
        LiterallyCanvas.prototype.update = function(shape) {
            var _this = this;
            this.repaint(false);
            return this.transformed(function() {
                return shape.update(_this.ctx);
            }, this.ctx);
        };
        LiterallyCanvas.prototype.draw = function(shapes, ctx, retryCallback) {
            var drawShapes, _this = this;
            if (!shapes.length) return;
            drawShapes = function() {
                var shape, _i, _len, _results;
                _results = [];
                for (_i = 0, _len = shapes.length; _i < _len; _i++) {
                    shape = shapes[_i];
                    _results.push(shape.draw(ctx, retryCallback));
                }
                return _results;
            };
            return this.transformed(drawShapes, ctx);
        };
        LiterallyCanvas.prototype.transformed = function(fn, ctx) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y);
            ctx.scale(this.scale, this.scale);
            fn();
            return ctx.restore();
        };
        LiterallyCanvas.prototype.clear = function() {
            var newShapes, oldShapes;
            oldShapes = this.shapes;
            newShapes = [];
            this.execute(new LC.ClearAction(this, oldShapes, newShapes));
            this.repaint();
            this.trigger("clear", null);
            return this.trigger("drawingChange", {});
        };
        LiterallyCanvas.prototype.execute = function(action) {
            this.undoStack.push(action);
            action["do"]();
            return this.redoStack = [];
        };
        LiterallyCanvas.prototype.undo = function() {
            var action;
            if (!this.undoStack.length) return;
            action = this.undoStack.pop();
            action.undo();
            this.redoStack.push(action);
            this.trigger("undo", {
                action: action
            });
            return this.trigger("drawingChange", {});
        };
        LiterallyCanvas.prototype.redo = function() {
            var action;
            if (!this.redoStack.length) return;
            action = this.redoStack.pop();
            this.undoStack.push(action);
            action["do"]();
            this.trigger("redo", {
                action: action
            });
            return this.trigger("drawingChange", {});
        };
        LiterallyCanvas.prototype.getPixel = function(x, y) {
            var p, pixel;
            p = this.drawingCoordsToClientCoords(x, y);
            pixel = this.ctx.getImageData(p.x, p.y, 1, 1).data;
            if (pixel[3]) {
                return "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
            } else {
                return null;
            }
        };
        LiterallyCanvas.prototype.canvasForExport = function() {
            this.repaint(true, true);
            return this.canvas;
        };
        LiterallyCanvas.prototype.getSnapshot = function() {
            var shape, _i, _len, _ref2, _results;
            _ref2 = this.shapes;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                shape = _ref2[_i];
                _results.push(shape.toJSON());
            }
            return _results;
        };
        LiterallyCanvas.prototype.getSnapshotJSON = function() {
            return JSON.stringify(this.shapes);
        };
        LiterallyCanvas.prototype.loadSnapshot = function(snapshot) {
            var shape, shapeRepr, _i, _len;
            this.shapes = [];
            this.repaint(true);
            for (_i = 0, _len = snapshot.length; _i < _len; _i++) {
                shapeRepr = snapshot[_i];
                if (shapeRepr.className in LC) {
                    shape = LC[shapeRepr.className].fromJSON(this, shapeRepr.data);
                    if (shape) this.execute(new LC.AddShapeAction(this, shape));
                }
            }
            return this.repaint(true);
        };
        LiterallyCanvas.prototype.loadSnapshotJSON = function(str) {
            this.loadSnapshot(JSON.parse(str));
            return this.repaint(true);
        };
        return LiterallyCanvas;
    }();
    LC.ClearAction = function() {
        function ClearAction(lc, oldShapes, newShapes) {
            this.lc = lc;
            this.oldShapes = oldShapes;
            this.newShapes = newShapes;
        }
        ClearAction.prototype["do"] = function() {
            this.lc.shapes = this.newShapes;
            return this.lc.repaint();
        };
        ClearAction.prototype.undo = function() {
            this.lc.shapes = this.oldShapes;
            return this.lc.repaint();
        };
        return ClearAction;
    }();
    LC.AddShapeAction = function() {
        function AddShapeAction(lc, shape) {
            this.lc = lc;
            this.shape = shape;
        }
        AddShapeAction.prototype["do"] = function() {
            this.ix = this.lc.shapes.length;
            this.lc.shapes.push(this.shape);
            return this.lc.repaint();
        };
        AddShapeAction.prototype.undo = function() {
            this.lc.shapes.pop(this.ix);
            return this.lc.repaint();
        };
        return AddShapeAction;
    }();
}).call(this);

(function() {
    var buttonIsDown, coordsForTouchEvent, position;
    coordsForTouchEvent = function($el, e) {
        var p, tx, ty;
        tx = e.originalEvent.changedTouches[0].pageX;
        ty = e.originalEvent.changedTouches[0].pageY;
        p = $el.offset();
        return [ tx - p.left, ty - p.top ];
    };
    position = function(e) {
        var p;
        if (e.offsetX != null) {
            return {
                left: e.offsetX,
                top: e.offsetY
            };
        } else {
            p = $(e.target).offset();
            return {
                left: e.pageX - p.left,
                top: e.pageY - p.top
            };
        }
    };
    buttonIsDown = function(e) {
        if (e.buttons != null) {
            return e.buttons === 1;
        } else {
            return e.which > 0;
        }
    };
    LC.bindEvents = function(lc, canvas, panWithKeyboard) {
        var $c, _this = this;
        if (panWithKeyboard == null) panWithKeyboard = false;
        $c = $(canvas);
        $c.mousedown(function(e) {
            var down, p;
            down = true;
            e.originalEvent.preventDefault();
            document.onselectstart = function() {
                return false;
            };
            p = position(e);
            return lc.begin(p.left, p.top);
        });
        $c.mousemove(function(e) {
            var p;
            e.originalEvent.preventDefault();
            p = position(e);
            return lc["continue"](p.left, p.top);
        });
        $c.mouseup(function(e) {
            var p;
            e.originalEvent.preventDefault();
            document.onselectstart = function() {
                return true;
            };
            p = position(e);
            return lc.end(p.left, p.top);
        });
        $c.mouseenter(function(e) {
            var p;
            p = position(e);
            if (buttonIsDown(e)) return lc.begin(p.left, p.top);
        });
        $c.mouseout(function(e) {
            var p;
            p = position(e);
            return lc.end(p.left, p.top);
        });
        $c.bind("touchstart", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length === 1) {
                return lc.begin.apply(lc, coordsForTouchEvent($c, e));
            } else {
                return lc["continue"].apply(lc, coordsForTouchEvent($c, e));
            }
        });
        $c.bind("touchmove", function(e) {
            e.preventDefault();
            return lc["continue"].apply(lc, coordsForTouchEvent($c, e));
        });
        $c.bind("touchend", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length !== 0) return;
            return lc.end.apply(lc, coordsForTouchEvent($c, e));
        });
        $c.bind("touchcancel", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length !== 0) return;
            return lc.end.apply(lc, coordsForTouchEvent($c, e));
        });
        if (panWithKeyboard) {
            return $(document).keydown(function(e) {
                switch (e.which) {
                  case 37:
                    lc.pan(-10, 0);
                    break;

                  case 38:
                    lc.pan(0, -10);
                    break;

                  case 39:
                    lc.pan(10, 0);
                    break;

                  case 40:
                    lc.pan(0, 10);
                }
                return lc.repaint();
            });
        }
    };
}).call(this);

(function() {
    var dual, mid, normals, refine, slope, unit, _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.bspline = function(points, order) {
        if (!order) return points;
        return LC.bspline(dual(dual(refine(points))), order - 1);
    };
    refine = function(points) {
        var index, point, refined, _i, _len;
        points = [ points[0] ].concat(points).concat(LC._last(points));
        refined = [];
        index = 0;
        for (_i = 0, _len = points.length; _i < _len; _i++) {
            point = points[_i];
            refined[index * 2] = point;
            if (points[index + 1]) {
                refined[index * 2 + 1] = mid(point, points[index + 1]);
            }
            index += 1;
        }
        return refined;
    };
    dual = function(points) {
        var dualed, index, point, _i, _len;
        dualed = [];
        index = 0;
        for (_i = 0, _len = points.length; _i < _len; _i++) {
            point = points[_i];
            if (points[index + 1]) dualed[index] = mid(point, points[index + 1]);
            index += 1;
        }
        return dualed;
    };
    mid = function(a, b) {
        return new LC.Point(a.x + (b.x - a.x) / 2, a.y + (b.y - a.y) / 2, a.size + (b.size - a.size) / 2, a.color);
    };
    LC.toPoly = function(line) {
        var index, n, point, polyLeft, polyRight, _i, _len;
        polyLeft = [];
        polyRight = [];
        index = 0;
        for (_i = 0, _len = line.length; _i < _len; _i++) {
            point = line[_i];
            n = normals(point, slope(line, index));
            polyLeft = polyLeft.concat([ n[0] ]);
            polyRight = [ n[1] ].concat(polyRight);
            index += 1;
        }
        return polyLeft.concat(polyRight);
    };
    slope = function(line, index) {
        var point;
        if (line.length < 3) {
            point = {
                x: 0,
                y: 0
            };
        }
        if (index === 0) {
            point = slope(line, index + 1);
        } else if (index === line.length - 1) {
            point = slope(line, index - 1);
        } else {
            point = LC.diff(line[index - 1], line[index + 1]);
        }
        return point;
    };
    LC.diff = function(a, b) {
        return {
            x: b.x - a.x,
            y: b.y - a.y
        };
    };
    unit = function(vector) {
        var length;
        length = LC.len(vector);
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    };
    normals = function(p, slope) {
        slope = unit(slope);
        slope.x = slope.x * p.size / 2;
        slope.y = slope.y * p.size / 2;
        return [ {
            x: p.x - slope.y,
            y: p.y + slope.x,
            color: p.color
        }, {
            x: p.x + slope.y,
            y: p.y - slope.x,
            color: p.color
        } ];
    };
    LC.len = function(vector) {
        return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    };
    LC.scalePositionScalar = function(val, viewportSize, oldScale, newScale) {
        var newSize, oldSize;
        oldSize = viewportSize * oldScale;
        newSize = viewportSize * newScale;
        return val + (oldSize - newSize) / 2;
    };
}).call(this);

(function() {
    var _ref, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.Shape = function() {
        function Shape() {}
        Shape.prototype.className = null;
        Shape.prototype.draw = function(ctx) {};
        Shape.prototype.update = function(ctx) {
            return this.draw(ctx);
        };
        Shape.prototype.toJSON = function() {
            return {
                className: this.className,
                data: this.jsonContent()
            };
        };
        Shape.prototype.jsonContent = function() {
            return raise("not implemented");
        };
        Shape.fromJSON = function(lc, data) {
            return raise("not implemented");
        };
        return Shape;
    }();
    LC.ImageShape = function(_super) {
        __extends(ImageShape, _super);
        ImageShape.prototype.className = "ImageShape";
        function ImageShape(x, y, image) {
            this.x = x;
            this.y = y;
            this.image = image;
        }
        ImageShape.prototype.draw = function(ctx, retryCallback) {
            if (this.image.width) {
                return ctx.drawImage(this.image, this.x, this.y);
            } else {
                return this.image.onload = retryCallback;
            }
        };
        ImageShape.prototype.jsonContent = function() {
            return {
                x: this.x,
                y: this.y,
                imageSrc: this.image.src
            };
        };
        ImageShape.fromJSON = function(lc, data) {
            var i, img;
            img = new Image();
            img.src = data.imageSrc;
            i = new LC.ImageShape(data.x, data.y, img);
            return i;
        };
        return ImageShape;
    }(LC.Shape);
    LC.Rectangle = function(_super) {
        __extends(Rectangle, _super);
        Rectangle.prototype.className = "Rectangle";
        function Rectangle(x, y, strokeWidth, strokeColor, fillColor) {
            this.x = x;
            this.y = y;
            this.strokeWidth = strokeWidth;
            this.strokeColor = strokeColor;
            this.fillColor = fillColor;
            this.width = 0;
            this.height = 0;
        }
        Rectangle.prototype.draw = function(ctx) {
            ctx.fillStyle = this.fillColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeStyle = this.strokeColor;
            return ctx.strokeRect(this.x, this.y, this.width, this.height);
        };
        Rectangle.prototype.jsonContent = function() {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                strokeWidth: this.strokeWidth,
                strokeColor: this.strokeColor,
                fillColor: this.fillColor
            };
        };
        Rectangle.fromJSON = function(lc, data) {
            var shape;
            shape = new LC.Rectangle(data.x, data.y, data.strokeWidth, data.strokeColor, data.fillColor);
            shape.width = data.width;
            shape.height = data.height;
            return shape;
        };
        return Rectangle;
    }(LC.Shape);
    LC.Line = function(_super) {
        __extends(Line, _super);
        Line.prototype.className = "Line";
        function Line(x1, y1, x2, y2, strokeWidth, color) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.strokeWidth = strokeWidth;
            this.color = color;
        }
        Line.prototype.draw = function(ctx) {
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeStyle = this.color;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            return ctx.stroke();
        };
        Line.prototype.jsonContent = function() {
            return {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2,
                strokeWidth: this.strokeWidth,
                color: this.color
            };
        };
        Line.fromJSON = function(lc, data) {
            var shape;
            shape = new LC.Line(data.x1, data.y1, data.x2, data.y2, data.strokeWidth, data.color);
            return shape;
        };
        return Line;
    }(LC.Shape);
    LC.LinePathShape = function(_super) {
        __extends(LinePathShape, _super);
        LinePathShape.prototype.className = "LinePathShape";
        function LinePathShape(_points, order, tailSize) {
            var point, _i, _len;
            if (_points == null) _points = [];
            this.order = order != null ? order : 3;
            this.tailSize = tailSize != null ? tailSize : 3;
            this.segmentSize = Math.pow(2, this.order);
            this.sampleSize = this.tailSize + 1;
            this.points = [];
            for (_i = 0, _len = _points.length; _i < _len; _i++) {
                point = _points[_i];
                this.addPoint(point);
            }
        }
        LinePathShape.prototype.jsonContent = function() {
            return {
                order: this.order,
                tailSize: this.tailSize,
                points: this.points
            };
        };
        LinePathShape.fromJSON = function(lc, data) {
            var pointData, points;
            points = function() {
                var _i, _len, _ref2, _results;
                _ref2 = data.points;
                _results = [];
                for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                    pointData = _ref2[_i];
                    _results.push(new LC.Point.fromJSON(lc, pointData));
                }
                return _results;
            }();
            return new LC.LinePathShape(points, data.order, data.tailSize);
        };
        LinePathShape.prototype.addPoint = function(point) {
            this.points.push(point);
            if (!this.smoothedPoints || this.points.length < this.sampleSize) {
                return this.smoothedPoints = LC.bspline(this.points, this.order);
            } else {
                this.tail = LC._last(LC.bspline(LC._last(this.points, this.sampleSize), this.order), this.segmentSize * this.tailSize);
                return this.smoothedPoints = this.smoothedPoints.slice(0, this.smoothedPoints.length - this.segmentSize * (this.tailSize - 1)).concat(this.tail);
            }
        };
        LinePathShape.prototype.draw = function(ctx) {
            var point, points, _i, _len, _ref2;
            points = this.smoothedPoints;
            if (!points.length) return;
            ctx.strokeStyle = points[0].color;
            ctx.lineWidth = points[0].size;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            _ref2 = points.slice(1);
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                point = _ref2[_i];
                ctx.lineTo(point.x, point.y);
            }
            return ctx.stroke();
        };
        return LinePathShape;
    }(LC.Shape);
    LC.EraseLinePathShape = function(_super) {
        __extends(EraseLinePathShape, _super);
        function EraseLinePathShape() {
            EraseLinePathShape.__super__.constructor.apply(this, arguments);
        }
        EraseLinePathShape.prototype.className = "EraseLinePathShape";
        EraseLinePathShape.prototype.draw = function(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            EraseLinePathShape.__super__.draw.call(this, ctx);
            return ctx.restore();
        };
        EraseLinePathShape.prototype.update = function(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            EraseLinePathShape.__super__.update.call(this, ctx);
            return ctx.restore();
        };
        EraseLinePathShape.fromJSON = function(lc, data) {
            var pointData, points;
            points = function() {
                var _i, _len, _ref2, _results;
                _ref2 = data.points;
                _results = [];
                for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                    pointData = _ref2[_i];
                    _results.push(new LC.Point.fromJSON(lc, pointData));
                }
                return _results;
            }();
            return new LC.EraseLinePathShape(points, data.order, data.tailSize);
        };
        return EraseLinePathShape;
    }(LC.LinePathShape);
    LC.Point = function() {
        Point.prototype.className = "Point";
        function Point(x, y, size, color) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.color = color;
        }
        Point.prototype.lastPoint = function() {
            return this;
        };
        Point.prototype.draw = function(ctx) {
            return console.log("draw point", this.x, this.y, this.size, this.color);
        };
        Point.prototype.jsonContent = function() {
            return {
                x: this.x,
                y: this.y,
                size: this.size,
                color: this.color
            };
        };
        Point.fromJSON = function(lc, data) {
            return new LC.Point(data.x, data.y, data.size, data.color);
        };
        return Point;
    }();
    LC.TextShape = function(_super) {
        __extends(TextShape, _super);
        TextShape.prototype.className = "TextShape";
        function TextShape(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
        }
        TextShape.prototype.draw = function(ctx) {
            ctx.font = "bold 18px sans-serif";
            ctx.fillStyle = this.color;
            return ctx.fillText(this.text, this.x, this.y);
        };
        TextShape.prototype.jsonContent = function() {
            return {
                x: this.x,
                y: this.y,
                text: this.text
            };
        };
        TextShape.fromJSON = function(lc, data) {
            return new LC.TextShape(data.x, data.y, data.text);
        };
        return TextShape;
    }(LC.Shape);
}).call(this);

(function() {
    var _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.toolbarHTML = '  <div class="toolbar-row">    <div class="toolbar-row-left">      <div class="tools button-group"></div>      &nbsp;&nbsp;&nbsp;&nbsp;Background:      <div class="color-square background-picker">&nbsp;</div>    </div>    <div class="toolbar-row-right">      <div class="action-buttons">        <div class="button clear-button danger">Clear</div>        <div class="button-group">          <div class="button btn-warning undo-button">&larr;</div><div class="button btn-warning redo-button">&rarr;</div>        </div>        <div class="button-group">          <div class="button btn-inverse zoom-out-button">&ndash;</div><div class="button btn-inverse zoom-in-button">+</div>        </div>        <div class="zoom-display">1</div>      </div>    </div>    <div class="clearfix"></div>  </div>  <div class="toolbar-row">    <div class="toolbar-row-left">      <div class="color-square primary-picker"></div>      <div class="color-square secondary-picker"></div>      <div class="tool-options-container"></div>    </div>    <div class="clearfix"></div>  </div>';
    LC.makeColorPicker = function($el, title, callback) {
        var cp;
        $el.data("color", "rgb(0, 0, 0)");
        cp = $el.colorpicker({
            format: "rgba"
        }).data("colorpicker");
        cp.hide();
        $el.on("changeColor", function(e) {
            callback(e.color.toRGB());
            return $(document).one("click", function() {
                return cp.hide();
            });
        });
        $el.click(function(e) {
            if (cp.picker.is(":visible")) {
                return cp.hide();
            } else {
                $(document).one("click", function() {
                    return $(document).one("click", function() {
                        return cp.hide();
                    });
                });
                cp.show();
                return cp.place();
            }
        });
        return cp;
    };
    LC.Toolbar = function() {
        function Toolbar(lc, $el, opts) {
            this.lc = lc;
            this.$el = $el;
            this.opts = opts;
            this.$el.append(LC.toolbarHTML);
            this.initColors();
            this.initButtons();
            this.initTools();
            this.initZoom();
        }
        Toolbar.prototype._bindColorPicker = function(name, title) {
            var $el, _this = this;
            $el = this.$el.find("." + name + "-picker");
            $el.css("background-color", this.lc.getColor(name));
            $el.css("background-position", "0% 0%");
            this.lc.on("" + name + "ColorChange", function(color) {
                return $el.css("background-color", color);
            });
            return LC.makeColorPicker($el, "" + title + " color", function(c) {
                _this.lc.setColor(name, "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + c.a + ")");
                return $el.css("background-position", "0% " + (1 - c.a) * 100 + "%");
            });
        };
        Toolbar.prototype.initColors = function() {
            var pickers;
            this.$el.find(".primary-picker, .secondary-picker, .background-picker").css("background-image", "url(" + this.opts.imageURLPrefix + "/alpha.png)");
            this.$el.find(".secondary-picker").css("background-position", "0% 100%");
            pickers = [ this._bindColorPicker("primary", "Primary (stroke)"), this._bindColorPicker("secondary", "Secondary (fill)"), this._bindColorPicker("background", "Background") ];
            this.lc.$canvas.mousedown(function() {
                var picker, _i, _len, _results;
                _results = [];
                for (_i = 0, _len = pickers.length; _i < _len; _i++) {
                    picker = pickers[_i];
                    _results.push(picker.hide());
                }
                return _results;
            });
            return this.lc.$canvas.on("touchstart", function() {
                var picker, _i, _len, _results;
                _results = [];
                for (_i = 0, _len = pickers.length; _i < _len; _i++) {
                    picker = pickers[_i];
                    _results.push(picker.hide());
                }
                return _results;
            });
        };
        Toolbar.prototype.initButtons = function() {
            var _this = this;
            this.$el.find(".clear-button").click(function(e) {
                return _this.lc.clear();
            });
            this.$el.find(".undo-button").click(function(e) {
                return _this.lc.undo();
            });
            return this.$el.find(".redo-button").click(function(e) {
                return _this.lc.redo();
            });
        };
        Toolbar.prototype.initTools = function() {
            var ToolClass, t, _i, _len, _ref2, _results;
            this.tools = [];
            _ref2 = this.opts.toolClasses;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                ToolClass = _ref2[_i];
                t = new ToolClass(this.opts);
                this.tools.push(t);
                _results.push(this.addTool(t));
            }
            return _results;
        };
        Toolbar.prototype.addTool = function(t) {
            var buttonEl, optsEl, _this = this;
            optsEl = $("<div class='tool-options tool-options-" + t.cssSuffix + "'></div>");
            optsEl.html(t.options());
            optsEl.hide();
            t.$el = optsEl;
            this.$el.find(".tool-options-container").append(optsEl);
            buttonEl = $("<div class='button tool-" + t.cssSuffix + "'>        <div class='tool-image-wrapper'></div></div>").appendTo(this.$el.find(".tools")).find(".tool-image-wrapper").html(t.button());
            buttonEl.click(function(e) {
                return _this.selectTool(t);
            });
            return null;
        };
        Toolbar.prototype.initZoom = function() {
            var _this = this;
            this.$el.find(".zoom-in-button").click(function(e) {
                _this.lc.zoom(.2);
                return _this.$el.find(".zoom-display").html(_this.lc.scale);
            });
            return this.$el.find(".zoom-out-button").click(function(e) {
                _this.lc.zoom(-.2);
                return _this.$el.find(".zoom-display").html(_this.lc.scale);
            });
        };
        Toolbar.prototype.selectTool = function(t) {
            this.$el.find(".tools .active").removeClass("active");
            this.$el.find(".tools .tool-" + t.cssSuffix).addClass("active");
            t.select(this.lc);
            this.$el.find(".tool-options").hide();
            if (t.$el) return t.$el.show();
        };
        return Toolbar;
    }();
}).call(this);

(function() {
    var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    LC.Tool = function() {
        function Tool() {}
        Tool.prototype.begin = function(x, y, lc) {};
        Tool.prototype["continue"] = function(x, y, lc) {};
        Tool.prototype.end = function(x, y, lc) {};
        return Tool;
    }();
    LC.StrokeTool = function(_super) {
        __extends(StrokeTool, _super);
        function StrokeTool() {
            this.strokeWidth = 5;
        }
        return StrokeTool;
    }(LC.Tool);
    LC.RectangleTool = function(_super) {
        __extends(RectangleTool, _super);
        function RectangleTool() {
            RectangleTool.__super__.constructor.apply(this, arguments);
        }
        RectangleTool.prototype.begin = function(x, y, lc) {
            return this.currentShape = new LC.Rectangle(x, y, this.strokeWidth, lc.getColor("primary"), lc.getColor("secondary"));
        };
        RectangleTool.prototype["continue"] = function(x, y, lc) {
            this.currentShape.width = x - this.currentShape.x;
            this.currentShape.height = y - this.currentShape.y;
            return lc.update(this.currentShape);
        };
        RectangleTool.prototype.end = function(x, y, lc) {
            return lc.saveShape(this.currentShape);
        };
        return RectangleTool;
    }(LC.StrokeTool);
    LC.LineTool = function(_super) {
        __extends(LineTool, _super);
        function LineTool() {
            LineTool.__super__.constructor.apply(this, arguments);
        }
        LineTool.prototype.begin = function(x, y, lc) {
            return this.currentShape = new LC.Line(x, y, x, y, this.strokeWidth, lc.getColor("primary"));
        };
        LineTool.prototype["continue"] = function(x, y, lc) {
            this.currentShape.x2 = x;
            this.currentShape.y2 = y;
            return lc.update(this.currentShape);
        };
        LineTool.prototype.end = function(x, y, lc) {
            return lc.saveShape(this.currentShape);
        };
        return LineTool;
    }(LC.StrokeTool);
    LC.Pencil = function(_super) {
        __extends(Pencil, _super);
        function Pencil() {
            Pencil.__super__.constructor.apply(this, arguments);
        }
        Pencil.prototype.begin = function(x, y, lc) {
            this.color = lc.getColor("primary");
            this.currentShape = this.makeShape();
            return this.currentShape.addPoint(this.makePoint(x, y, lc));
        };
        Pencil.prototype["continue"] = function(x, y, lc) {
            this.currentShape.addPoint(this.makePoint(x, y, lc));
            return lc.update(this.currentShape);
        };
        Pencil.prototype.end = function(x, y, lc) {
            lc.saveShape(this.currentShape);
            return this.currentShape = void 0;
        };
        Pencil.prototype.makePoint = function(x, y, lc) {
            return new LC.Point(x, y, this.strokeWidth, this.color);
        };
        Pencil.prototype.makeShape = function() {
            return new LC.LinePathShape(this);
        };
        return Pencil;
    }(LC.StrokeTool);
    LC.Eraser = function(_super) {
        __extends(Eraser, _super);
        function Eraser() {
            this.strokeWidth = 10;
        }
        Eraser.prototype.makePoint = function(x, y, lc) {
            return new LC.Point(x, y, this.strokeWidth, "#000");
        };
        Eraser.prototype.makeShape = function() {
            return new LC.EraseLinePathShape(this);
        };
        return Eraser;
    }(LC.Pencil);
    LC.Pan = function(_super) {
        __extends(Pan, _super);
        function Pan() {
            Pan.__super__.constructor.apply(this, arguments);
        }
        Pan.prototype.begin = function(x, y, lc) {
            return this.start = {
                x: x,
                y: y
            };
        };
        Pan.prototype["continue"] = function(x, y, lc) {
            lc.pan(this.start.x - x, this.start.y - y);
            return lc.repaint();
        };
        return Pan;
    }(LC.Tool);
    LC.EyeDropper = function(_super) {
        __extends(EyeDropper, _super);
        function EyeDropper() {
            EyeDropper.__super__.constructor.apply(this, arguments);
        }
        EyeDropper.prototype.readColor = function(x, y, lc) {
            var newColor;
            newColor = lc.getPixel(x, y);
            return lc.setColor("primary", newColor || lc.getColor("background"));
        };
        EyeDropper.prototype.begin = function(x, y, lc) {
            return this.readColor(x, y, lc);
        };
        EyeDropper.prototype["continue"] = function(x, y, lc) {
            return this.readColor(x, y, lc);
        };
        return EyeDropper;
    }(LC.Tool);
    LC.TextTool = function(_super) {
        __extends(TextTool, _super);
        function TextTool(text) {
            this.text = text != null ? text : "";
        }
        TextTool.prototype.setText = function(text) {
            return this.text = text;
        };
        TextTool.prototype.begin = function(x, y, lc) {
            this.color = lc.getColor("primary");
            return this.currentShape = new LC.TextShape(x, y, this.text, this.color);
        };
        TextTool.prototype["continue"] = function(x, y, lc) {
            this.currentShape.x = x;
            this.currentShape.y = y;
            return lc.update(this.currentShape);
        };
        TextTool.prototype.end = function(x, y, lc) {
            return lc.saveShape(this.currentShape);
        };
        return TextTool;
    }(LC.Tool);
}).call(this);

(function() {
    var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    LC.Widget = function() {
        function Widget(opts) {
            this.opts = opts;
        }
        Widget.prototype.title = void 0;
        Widget.prototype.cssSuffix = void 0;
        Widget.prototype.button = function() {
            return;
        };
        Widget.prototype.options = function() {
            return;
        };
        Widget.prototype.select = function(lc) {};
        return Widget;
    }();
    LC.ToolWidget = function(_super) {
        __extends(ToolWidget, _super);
        function ToolWidget(opts) {
            this.opts = opts;
            this.tool = this.makeTool();
        }
        ToolWidget.prototype.select = function(lc) {
            return lc.setTool(this.tool);
        };
        ToolWidget.prototype.makeTool = function() {
            return;
        };
        return ToolWidget;
    }(LC.Widget);
    LC.StrokeWidget = function(_super) {
        __extends(StrokeWidget, _super);
        function StrokeWidget() {
            StrokeWidget.__super__.constructor.apply(this, arguments);
        }
        StrokeWidget.prototype.options = function() {
            var $brushWidthVal, $el, $input, _this = this;
            $el = $("<span class='brush-width-min'>1 px</span><input type='range' min='1' max='50' step='1' value='" + this.tool.strokeWidth + "'><span class='brush-width-max'>50 px</span><span class='brush-width-val'>(5 px)</span>");
            $input = $el.filter("input");
            if ($input.size() === 0) $input = $el.find("input");
            $brushWidthVal = $el.filter(".brush-width-val");
            if ($brushWidthVal.size() === 0) {
                $brushWidthVal = $el.find(".brush-width-val");
            }
            $input.change(function(e) {
                _this.tool.strokeWidth = parseInt($(e.currentTarget).val(), 10);
                return $brushWidthVal.html("(" + _this.tool.strokeWidth + " px)");
            });
            return $el;
        };
        return StrokeWidget;
    }(LC.ToolWidget);
    LC.RectangleWidget = function(_super) {
        __extends(RectangleWidget, _super);
        function RectangleWidget() {
            RectangleWidget.__super__.constructor.apply(this, arguments);
        }
        RectangleWidget.prototype.title = "Rectangle";
        RectangleWidget.prototype.cssSuffix = "rectangle";
        RectangleWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/rectangle.png'>";
        };
        RectangleWidget.prototype.makeTool = function() {
            return new LC.RectangleTool();
        };
        return RectangleWidget;
    }(LC.StrokeWidget);
    LC.LineWidget = function(_super) {
        __extends(LineWidget, _super);
        function LineWidget() {
            LineWidget.__super__.constructor.apply(this, arguments);
        }
        LineWidget.prototype.title = "Line";
        LineWidget.prototype.cssSuffix = "line";
        LineWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/line.png'>";
        };
        LineWidget.prototype.makeTool = function() {
            return new LC.LineTool();
        };
        return LineWidget;
    }(LC.StrokeWidget);
    LC.PencilWidget = function(_super) {
        __extends(PencilWidget, _super);
        function PencilWidget() {
            PencilWidget.__super__.constructor.apply(this, arguments);
        }
        PencilWidget.prototype.title = "Pencil";
        PencilWidget.prototype.cssSuffix = "pencil";
        PencilWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/pencil.png'>";
        };
        PencilWidget.prototype.makeTool = function() {
            return new LC.Pencil();
        };
        return PencilWidget;
    }(LC.StrokeWidget);
    LC.EraserWidget = function(_super) {
        __extends(EraserWidget, _super);
        function EraserWidget() {
            EraserWidget.__super__.constructor.apply(this, arguments);
        }
        EraserWidget.prototype.title = "Eraser";
        EraserWidget.prototype.cssSuffix = "eraser";
        EraserWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/eraser.png'>";
        };
        EraserWidget.prototype.makeTool = function() {
            return new LC.Eraser();
        };
        return EraserWidget;
    }(LC.PencilWidget);
    LC.PanWidget = function(_super) {
        __extends(PanWidget, _super);
        function PanWidget() {
            PanWidget.__super__.constructor.apply(this, arguments);
        }
        PanWidget.prototype.title = "Pan";
        PanWidget.prototype.cssSuffix = "pan";
        PanWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/pan.png'>";
        };
        PanWidget.prototype.makeTool = function() {
            return new LC.Pan();
        };
        return PanWidget;
    }(LC.ToolWidget);
    LC.EyeDropperWidget = function(_super) {
        __extends(EyeDropperWidget, _super);
        function EyeDropperWidget() {
            EyeDropperWidget.__super__.constructor.apply(this, arguments);
        }
        EyeDropperWidget.prototype.title = "Eyedropper";
        EyeDropperWidget.prototype.cssSuffix = "eye-dropper";
        EyeDropperWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/eyedropper.png'>";
        };
        EyeDropperWidget.prototype.makeTool = function() {
            return new LC.EyeDropper();
        };
        return EyeDropperWidget;
    }(LC.ToolWidget);
    LC.TextWidget = function(_super) {
        __extends(TextWidget, _super);
        function TextWidget() {
            TextWidget.__super__.constructor.apply(this, arguments);
        }
        TextWidget.prototype.title = "Text";
        TextWidget.prototype.cssSuffix = "text";
        TextWidget.prototype.button = function() {
            return "<img src='" + this.opts.imageURLPrefix + "/text.png'>";
        };
        TextWidget.prototype.select = function(lc) {
            var _this = this;
            lc.setTool(this.tool);
            return setTimeout(function() {
                _this.$input.focus();
                return _this.$input.select();
            }, 0);
        };
        TextWidget.prototype.makeTool = function() {
            return new LC.TextTool();
        };
        TextWidget.prototype.options = function() {
            var $el, _this = this;
            $el = $("<input type='text' placeholder='Enter text here'        value='" + this.tool.text + "'>       <span class='instructions'>Click and hold to place text.</span>");
            this.$input = $el.filter("input");
            if (this.$input.size() === 0) this.$input = $el.find("input");
            this.$input.change(function(e) {
                return _this.tool.text = _this.$input.val();
            });
            this.$input.keyup(function(e) {
                return _this.tool.text = _this.$input.val();
            });
            return $el;
        };
        return TextWidget;
    }(LC.ToolWidget);
}).call(this);

(function() {
    var slice, _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    slice = Array.prototype.slice;
    LC._last = function(array, n) {
        if (n == null) n = null;
        if (n) {
            return slice.call(array, Math.max(array.length - n, 0));
        } else {
            return array[array.length - 1];
        }
    };
    LC.init = function(el, opts) {
        var $el, $tbEl, lc, resize, tb;
        if (opts == null) opts = {};
        if (opts.primaryColor == null) opts.primaryColor = "#000";
        if (opts.secondaryColor == null) opts.secondaryColor = "#fff";
        if (opts.backgroundColor == null) opts.backgroundColor = "transparent";
        if (opts.imageURLPrefix == null) opts.imageURLPrefix = "lib/img";
        if (opts.keyboardShortcuts == null) opts.keyboardShortcuts = true;
        if (opts.preserveCanvasContents == null) opts.preserveCanvasContents = false;
        if (opts.sizeToContainer == null) opts.sizeToContainer = true;
        if (opts.backgroundShapes == null) opts.backgroundShapes = [];
        if (opts.watermarkImage == null) opts.watermarkImage = null;
        if (!("toolClasses" in opts)) {
            opts.toolClasses = [ LC.PencilWidget, LC.EraserWidget, LC.LineWidget, LC.RectangleWidget, LC.TextWidget, LC.PanWidget, LC.EyeDropperWidget ];
        }
        $el = $(el);
        $el.addClass("literally");
        $tbEl = $('<div class="toolbar">');
        $el.append($tbEl);
        if (!$el.find("canvas").length) $el.append("<canvas>");
        lc = new LC.LiterallyCanvas($el.find("canvas").get(0), opts);
        tb = new LC.Toolbar(lc, $tbEl, opts);
        tb.selectTool(tb.tools[0]);
        resize = function() {
            if (opts.sizeToContainer) {
                lc.$canvas.css("height", "" + ($el.height() - $tbEl.height()) + "px");
            }
            return lc.updateSize();
        };
        $el.resize(resize);
        $(window).bind("orientationchange resize", resize);
        resize();
        if ("onInit" in opts) opts.onInit(lc);
        return [ lc, tb ];
    };
    $.fn.literallycanvas = function(opts) {
        var _this = this;
        if (opts == null) opts = {};
        this.each(function(ix, el) {
            var _ref2;
            return _ref2 = LC.init(el, opts), el.literallycanvas = _ref2[0], el.literallycanvasToolbar = _ref2[1], 
            _ref2;
        });
        return this;
    };
}).call(this);