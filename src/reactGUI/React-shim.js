let React;
try {
    React = require("react");
} catch (error) {
    ({ React } = window);
}
if (React == null) {
    throw "Can't find React";
}


export default React;