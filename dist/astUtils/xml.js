"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSGCustomization = exports.isSGNode = exports.isSGFunction = exports.isSGField = exports.isSGChildren = exports.isSGScript = exports.isSGInterface = exports.isSGComponent = void 0;
function isSGComponent(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGComponent';
}
exports.isSGComponent = isSGComponent;
function isSGInterface(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGInterface';
}
exports.isSGInterface = isSGInterface;
function isSGScript(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGScript';
}
exports.isSGScript = isSGScript;
function isSGChildren(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGChildren';
}
exports.isSGChildren = isSGChildren;
function isSGField(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGField';
}
exports.isSGField = isSGField;
function isSGFunction(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGFunction';
}
exports.isSGFunction = isSGFunction;
function isSGNode(tag) {
    return (tag === null || tag === void 0 ? void 0 : tag.constructor.name) === 'SGNode';
}
exports.isSGNode = isSGNode;
function isSGCustomization(tag) {
    var _a, _b;
    return isSGNode(tag) && ((_b = (_a = tag.tag) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'customization';
}
exports.isSGCustomization = isSGCustomization;
//# sourceMappingURL=xml.js.map