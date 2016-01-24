const { LiterallyCanvasReactComponent } = window.LC;

const DemoApp = React.createClass({
    getInitialState() {
        const backgroundImage = new Image();
        backgroundImage.src = '/demo/bear.png';
        return {
            isSetUp: true,
            svgText: "",
            lcOptions: {
                backgroundImage: backgroundImage,
                toolbarPosition: 'bottom',
                snapshot: JSON.parse(localStorage.getItem('drawing')),
                backgroundShapes: [
                  LC.createShape(
                    'Image', {image: backgroundImage, x: 100, y: 100, scale: 2}),
                  LC.createShape(
                    'Rectangle',
                    {x: 0, y: 0, width: 100, height: 100, strokeColor: '#000'})
                ],
                onInit: this.onInit,
                imageURLPrefix: "/lib/img"
            }
        };
    },

    onInit: function(lc) {
        this.lc = lc;
        const watermarkImage = new Image();
        watermarkImage.src = '/demo/watermark.png';
        lc.setWatermarkImage(watermarkImage);

        lc.on('drawingChange', this.save);
        lc.on('pan', this.save);
        lc.on('zoom', this.save);
        this.save();
    },

    save() {
        localStorage.setItem('drawing', JSON.stringify(this.lc.getSnapshot()));
        this.setState({svgText: this.lc.getSVGString()});
    },

    actionOpenImage() {
      window.open(this.lc.getImage({
        // rect: {x: 0, y: 0, width: 100, height: 100}
        scale: 1, margin: {top: 10, right: 10, bottom: 10, left: 10}
      }).toDataURL());
    },

    actionChangeSize() {
        this.lc.setImageSize(null, 200)
    },

    actionSetUp() {
        this.setState({isSetUp: true});
    },

    actionTearDown() {
        this.setState({isSetUp: false});
    },

    render() {
        return <div>
            {this.state.isSetUp && <LiterallyCanvasReactComponent {...this.state.lcOptions} />}
            <a onClick={this.actionOpenImage}>open image</a><br />
            <a onClick={this.actionChangeSize}>change size</a><br />
            {this.state.isSetUp && <a onClick={this.actionTearDown}>teardown</a>}
            {!this.state.isSetUp && <a onClick={this.actionSetUp}>setup</a>}
            <br />
            <div className="svg-container" dangerouslySetInnerHTML={{__html: this.state.svgText}} />
        </div>;
    } 
});


ReactDOM.render(
  <DemoApp />,
  document.getElementById('app-container')
);
