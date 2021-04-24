"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const defaultConfig = require("../config.json");
exports.default = Object.assign({}, defaultConfig);
const config = (config) => (Object.assign(Object.assign({}, defaultConfig), config));
exports.config = config;
//# sourceMappingURL=config.js.map