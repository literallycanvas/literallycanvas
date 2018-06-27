import Ellipse from "../tools/Ellipse";
import Eraser from "../tools/Eraser";
import Eyedropper from "../tools/Eyedropper";
import Line from "../tools/Line";
import Pan from "../tools/Pan";
import Pencil from "../tools/Pencil";
import Polygon from "../tools/Polygon";
import Rectangle from "../tools/Rectangle";
import Text from "../tools/Text";


const defaultOptions = {
    imageURLPrefix: "lib/img",
    primaryColor: "hsla(0, 0%, 0%, 1)",
    secondaryColor: "hsla(0, 0%, 100%, 1)",
    backgroundColor: "transparent",
    strokeWidths: [1, 2, 5, 10, 20, 30],
    defaultStrokeWidth: 5,
    toolbarPosition: "top",
    keyboardShortcuts: false,
    imageSize: {width: "infinite", height: "infinite"},
    backgroundShapes: [],
    watermarkImage: null,
    watermarkScale: 1,
    zoomMin: 0.2,
    zoomMax: 4.0,
    zoomStep: 0.2,
    snapshot: null,
    onInit: (() => {}),

    tools: [
        Pencil,
        Eraser,
        Line,
        Rectangle,
        Ellipse,
        Text,
        Polygon,
        Pan,
        Eyedropper
    ]
};


export default defaultOptions;