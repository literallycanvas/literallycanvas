/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let createSetStateOnEventMixin;
import React from "./React-shim";

export default (createSetStateOnEventMixin = function(eventName) {
    return {
        componentDidMount() {
            return this.unsubscribe = this.props.lc.on(eventName, () => this.setState(this.getState()));
        },
        componentWillUnmount() { return this.unsubscribe() }
    };
});
