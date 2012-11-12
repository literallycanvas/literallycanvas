#!/bin/bash
coffee -o js/coffee -c coffee
uglifyjs2 js/jquery-1.8.2.js js/underscore-1.4.2.js js/backbone-0.9.2.js js/bootstrap-just-popovers.js js/coffee/* -o js/gen/packed.js --beautify
