let strings = {};

const localize = localStrings => strings = localStrings;

const _ = function(string) {
    const translation = strings[string];
    return translation || string;
};


export { localize, _ };