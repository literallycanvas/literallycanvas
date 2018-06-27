

const createSetStateOnEventMixin = function(eventName) {
    return {
        componentDidMount() {
            return this.unsubscribe = this.props.lc.on(eventName, () => this.setState(this.getState()));
        },
        componentWillUnmount() { return this.unsubscribe() }
    };
};


export default createSetStateOnEventMixin;