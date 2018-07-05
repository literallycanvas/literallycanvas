import "./fontmetrics.js";


const parseFontString = function(font) {
    const fontItems = font.split(" ");

    let fontSize = 0;

    for (let item of fontItems) {
        const maybeSize = parseInt(item.replace("px", ""), 10);
        if (!isNaN(maybeSize)) {
            fontSize = maybeSize;
        }
    }
    if (!fontSize) { throw "Font size not found" }

    const remainingFontString = font.substring(fontItems[0].length + 1)
        .replace("bold ", "")
        .replace("italic ", "")
        .replace("underline ", "");

    const fontFamily = remainingFontString;

    return {fontSize, fontFamily};
};


const getNextLine = function(ctx, text, forcedWidth) {
    if (!text.length) {
        return ["", ""];
    }

    let endIndex = 0;
    let lastGoodIndex = 0;
    let lastOkayIndex = 0;
    let wasInWord = false;

    while (true) {
        endIndex += 1;
        const isEndOfString = endIndex >= text.length;

        const isWhitespace = (!isEndOfString) && text[endIndex].match(/\s/);
        const isNonWord = isWhitespace || isEndOfString;

        const textToHere = text.substring(0, endIndex);
        const doesSubstringFit = forcedWidth ?
            ctx.measureTextWidth(textToHere).width <= forcedWidth
            :
            true;

        if (doesSubstringFit) {
            lastOkayIndex = endIndex;
        }

        // word -> non-word
        if (isNonWord && wasInWord) {
            wasInWord = false;
            if (doesSubstringFit) {
                lastGoodIndex = endIndex;
            }
        }

        wasInWord = !isWhitespace;

        if (isEndOfString || !doesSubstringFit) {
            if (doesSubstringFit) {
                return [text, ""];
            } else if (lastGoodIndex > 0) {
                let nextWordStartIndex = lastGoodIndex + 1;
                while ((nextWordStartIndex < text.length) && text[nextWordStartIndex].match(/\s/)) {
                    nextWordStartIndex += 1;
                }
                return [
                    text.substring(0, lastGoodIndex), text.substring(nextWordStartIndex)];
            } else {
                return [
                    text.substring(0, lastOkayIndex), text.substring(lastOkayIndex)];
            }
        }
    }
};


const getLinesToRender = function(ctx, text, forcedWidth) {
    const textSplitOnLines = text.split(/\r\n|\r|\n/g);

    const lines = [];
    for (let textLine of textSplitOnLines) {
        let [nextLine, remainingText] = getNextLine(ctx, textLine, forcedWidth);
        if (nextLine) {
            while (nextLine) {
                lines.push(nextLine);
                [nextLine, remainingText] = getNextLine(ctx, remainingText, forcedWidth);
            }
        } else {
            lines.push(textLine);
        }
    }
    return lines;
};


class TextRenderer {
    constructor(ctx, text, font, forcedWidth, forcedHeight) {
        this.text = text;
        this.font = font;
        this.forcedWidth = forcedWidth;
        this.forcedHeight = forcedHeight;
        const {fontFamily, fontSize} = parseFontString(this.font);

        ctx.font = this.font;
        ctx.textBaseline = "baseline";
        this.emDashWidth = ctx.measureTextWidth("—", fontSize, fontFamily).width;
        this.caratWidth = ctx.measureTextWidth("|", fontSize, fontFamily).width;

        this.lines = getLinesToRender(ctx, this.text, this.forcedWidth);

        // we need to get metrics line by line and combine them. :-(
        this.metricses = this.lines.map(line => {
            return ctx.measureText2(line || "X", fontSize, this.font);
        });

        this.metrics = {
            ascent: Math.max(...this.metricses.map(({ascent}) => ascent)),
            descent: Math.max(...this.metricses.map(({descent}) => descent)),
            fontsize: Math.max(...this.metricses.map(({fontsize}) => fontsize)),
            leading: Math.max(...this.metricses.map(({leading}) => leading)),
            width: Math.max(...this.metricses.map(({width}) => width)),
            height: Math.max(...this.metricses.map(({height}) => height)),
            bounds: {
                minx: Math.min(...this.metricses.map(({bounds}) => bounds.minx)),
                miny: Math.min(...this.metricses.map(({bounds}) => bounds.miny)),
                maxx: Math.max(...this.metricses.map(({bounds}) => bounds.maxx)),
                maxy: Math.max(...this.metricses.map(({bounds}) => bounds.maxy))
            }
        };

        this.boundingBoxWidth = Math.ceil(this.metrics.width);
    }

    draw(ctx, x, y) {
        ctx.textBaseline = "top";
        ctx.font = this.font;
        let i = 0;

        for (let line of this.lines) {
            ctx.fillText(line, x, y + (i++ * this.metrics.leading));
        }
    }

    getWidth(isEditing) {
    // if isEditing == true, add X padding to account for carat
        if (isEditing == null) { isEditing = false }
        if (this.forcedWidth) {
            return this.forcedWidth;
        } else {
            if (isEditing) {
                return this.metrics.bounds.maxx + this.caratWidth;
            } else {
                return this.metrics.bounds.maxx;
            }
        }
    }
    getHeight() { return this.forcedHeight || (this.metrics.leading * this.lines.length) }
}


export default TextRenderer;