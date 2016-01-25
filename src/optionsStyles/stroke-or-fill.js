const React = require('../reactGUI/React-shim');
const { defineOptionsStyle } = require('./optionsStyles');
const createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');

defineOptionsStyle('stroke-or-fill', React.createClass({
  displayName: 'StrokeOrFillPicker',
  getState: function() { return {strokeOrFill: 'stroke'}; },
  getInitialState: function() { return this. getState(); },
  mixins: [createSetStateOnEventMixin('toolChange')],

  onChange: function(e) {
    if (e.target.id == 'stroke-or-fill-stroke') {
      this.props.lc.tool.strokeOrFill = 'stroke';
    } else {
      this.props.lc.tool.strokeOrFill = 'fill';
    }
    this.setState(this.getState());
  },

  render: function() {
    const lc = this.props.lc;

    return <form>
      <span>Color to change: </span>
      <span>
        <input type="radio" name="stroke-or-fill" value="stroke"
          id="stroke-or-fill-stroke" onChange={this.onChange}
          checked={lc.tool.strokeOrFill == 'stroke'} />
        <label htmlFor="stroke-or-fill-stroke" className="label"> stroke</label>
      </span>
      <span>
        <input type="radio" name="stroke-or-fill" value="fill"
          id="stroke-or-fill-fill" onChange={this.onChange}
          checked={lc.tool.strokeOrFill == 'fill'} />
        <label htmlFor="stroke-or-fill-fill" className="label"> fill</label>
      </span>
    </form>;
  }
}));

module.exports = {}
