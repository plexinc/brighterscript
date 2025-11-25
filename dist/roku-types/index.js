"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = exports.interfaces = exports.components = exports.nodes = void 0;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("./data.json");
//apply any transforms/overrides before exporting
exports.nodes = data.nodes;
exports.components = data.components;
exports.interfaces = data.interfaces;
exports.events = data.events;
//# sourceMappingURL=index.js.map