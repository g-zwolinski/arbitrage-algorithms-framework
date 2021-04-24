"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.floatRound = exports.validationException = exports.log = exports.errorLogTemplate = void 0;
const errorLogTemplate = (e) => `\x1b[31m${e.name} ${e.message}\x1b[0m`;
exports.errorLogTemplate = errorLogTemplate;
function log(message, type = 'log', run = true) {
    if (!run) {
        return;
    }
    console[type](message);
}
exports.log = log;
const validationException = (algorithmType, message) => ({
    message: `\n\x1b[31m${message}\x1b[0m`,
    name: `\x1b[31m${algorithmType} Validation Exception${message ? ':' : ''}\x1b[0m`
});
exports.validationException = validationException;
const floatRound = (value, precision, type) => {
    switch (type) {
        case 'ceil': return Math.ceil(value * Math.pow(10, precision)) / Math.pow(10, precision);
        case 'floor': return Math.floor(value * Math.pow(10, precision)) / Math.pow(10, precision);
        case 'round': return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    }
};
exports.floatRound = floatRound;
//# sourceMappingURL=helpers.js.map