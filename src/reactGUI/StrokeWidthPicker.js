/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import DOM from "../reactGUI/ReactDOMFactories-shim";
import createReactClass from "../reactGUI/createReactClass-shim";
import createSetStateOnEventMixin from "../reactGUI/createSetStateOnEventMixin";
import { classSet } from "../core/util";


export default createReactClass({
    displayName: "StrokeWidthPicker",

    getState(tool) { if (tool == null) { ({ tool } = this.props) } return {strokeWidth: tool.strokeWidth} },
    getInitialState() { return this.getState() },
    mixins: [createSetStateOnEventMixin("toolDidUpdateOptions")],

    componentWillReceiveProps(props) { return this.setState(this.getState(props.tool)) },

    render() {
        const {ul, li, svg, circle, div} = DOM;
        const { strokeWidths } = this.props.lc.opts;

        return (div({},
            strokeWidths.map((strokeWidth, ix) => {
                const buttonClassName = classSet({
                    "square-toolbar-button": true,
                    "selected": strokeWidth === this.state.strokeWidth
                });
                const buttonSize = 28;
                return (div({
                    key: strokeWidth
                },
                    (div( 
                        {
                            className: buttonClassName,
                            onClick: () => this.props.lc.trigger("setStrokeWidth", strokeWidth)
                        },
                        (svg( 
                            {
                                width: buttonSize-2,
                                height: buttonSize-2,
                                viewport: `0 0 ${strokeWidth} ${strokeWidth}`,
                                version: "1.1",
                                xmlns: "http://www.w3.org/2000/svg"
                            },
                            (circle({
                                cx: Math.ceil((buttonSize/2)-1),
                                cy: Math.ceil((buttonSize/2)-1),
                                r: strokeWidth/2
                            }))
                        ))
                    ))
                ));
            })
        ));
    }
});
