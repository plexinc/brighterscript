"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SGAst = exports.SGComponent = exports.SGInterface = exports.SGFunction = exports.SGFieldTypes = exports.SGField = exports.SGScript = exports.SGChildren = exports.SGNode = exports.SGProlog = exports.SGTag = void 0;
const source_map_1 = require("source-map");
const creators_1 = require("../astUtils/creators");
const xml_1 = require("../astUtils/xml");
const util_1 = require("../util");
class SGTag {
    constructor(tag, attributes = [], range) {
        this.tag = tag;
        this.attributes = attributes;
        this.range = range;
    }
    get id() {
        return this.getAttributeValue('id');
    }
    set id(value) {
        this.setAttribute('id', value);
    }
    getAttribute(name) {
        return this.attributes.find(att => att.key.text.toLowerCase() === name);
    }
    getAttributeValue(name) {
        var _a, _b;
        return (_b = (_a = this.getAttribute(name.toLowerCase())) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.text;
    }
    setAttribute(name, value) {
        const attr = this.getAttribute(name);
        if (attr) {
            if (value) {
                attr.value = { text: value };
                attr.range = undefined;
            }
            else {
                this.attributes.splice(this.attributes.indexOf(attr), 1);
            }
        }
        else if (value) {
            this.attributes.push({
                key: { text: name },
                value: { text: value }
            });
        }
    }
    transpile(state) {
        return new source_map_1.SourceNode(null, null, state.srcPath, [
            state.indentText,
            '<',
            state.transpileToken(this.tag),
            ...this.transpileAttributes(state, this.attributes),
            ...this.transpileBody(state)
        ]);
    }
    transpileBody(state) {
        return [' />\n'];
    }
    transpileAttributes(state, attributes) {
        var _a, _b;
        const result = [];
        for (const attr of attributes) {
            result.push(' ', state.transpileToken(attr.key), '=', state.transpileToken((_a = attr.openQuote) !== null && _a !== void 0 ? _a : { text: '"' }), state.transpileToken(attr.value), state.transpileToken((_b = attr.closeQuote) !== null && _b !== void 0 ? _b : { text: '"' }));
        }
        return result;
    }
}
exports.SGTag = SGTag;
class SGProlog extends SGTag {
    transpile(state) {
        return new source_map_1.SourceNode(null, null, state.srcPath, [
            '<?xml',
            ...this.transpileAttributes(state, this.attributes),
            ' ?>\n'
        ]);
    }
}
exports.SGProlog = SGProlog;
class SGNode extends SGTag {
    constructor(tag, attributes, children = [], range) {
        super(tag, attributes, range);
        this.children = children;
    }
    transpileBody(state) {
        if (this.children.length > 0) {
            const body = ['>\n'];
            state.blockDepth++;
            body.push(...this.children.map(node => node.transpile(state)));
            state.blockDepth--;
            body.push(state.indentText, '</', this.tag.text, '>\n');
            return body;
        }
        else {
            return super.transpileBody(state);
        }
    }
}
exports.SGNode = SGNode;
class SGChildren extends SGNode {
    constructor(tag = { text: 'children' }, children = [], range) {
        super(tag, [], children, range);
    }
}
exports.SGChildren = SGChildren;
class SGScript extends SGTag {
    constructor(tag = { text: 'script' }, attributes, cdata, range) {
        super(tag, attributes, range);
        this.cdata = cdata;
        if (!attributes) {
            this.type = 'text/brightscript';
        }
    }
    get type() {
        return this.getAttributeValue('type');
    }
    set type(value) {
        this.setAttribute('type', value);
    }
    get uri() {
        return this.getAttributeValue('uri');
    }
    set uri(value) {
        this.setAttribute('uri', value);
    }
    transpileBody(state) {
        if (this.cdata) {
            return [
                '>',
                state.transpileToken(this.cdata),
                '</',
                this.tag.text,
                '>\n'
            ];
        }
        else {
            return super.transpileBody(state);
        }
    }
    transpileAttributes(state, attributes) {
        const modifiedAttributes = [];
        let foundType = false;
        const bsExtensionRegexp = /\.bs$/i;
        for (const attr of attributes) {
            const lowerKey = attr.key.text.toLowerCase();
            if (lowerKey === 'uri' && bsExtensionRegexp.exec(attr.value.text)) {
                modifiedAttributes.push(util_1.default.cloneSGAttribute(attr, attr.value.text.replace(bsExtensionRegexp, '.brs')));
            }
            else if (lowerKey === 'type') {
                foundType = true;
                if (attr.value.text.toLowerCase().endsWith('brighterscript')) {
                    modifiedAttributes.push(util_1.default.cloneSGAttribute(attr, 'text/brightscript'));
                }
                else {
                    modifiedAttributes.push(attr);
                }
            }
            else {
                modifiedAttributes.push(attr);
            }
        }
        if (!foundType) {
            modifiedAttributes.push((0, creators_1.createSGAttribute)('type', 'text/brightscript'));
        }
        return super.transpileAttributes(state, modifiedAttributes);
    }
}
exports.SGScript = SGScript;
class SGField extends SGTag {
    constructor(tag = { text: 'field' }, attributes = [], range) {
        super(tag, attributes, range);
    }
    get type() {
        return this.getAttributeValue('type');
    }
    set type(value) {
        this.setAttribute('type', value);
    }
    get alias() {
        return this.getAttributeValue('alias');
    }
    set alias(value) {
        this.setAttribute('alias', value);
    }
    get value() {
        return this.getAttributeValue('value');
    }
    set value(value) {
        this.setAttribute('value', value);
    }
    get onChange() {
        return this.getAttributeValue('onChange');
    }
    set onChange(value) {
        this.setAttribute('onChange', value);
    }
    get alwaysNotify() {
        return this.getAttributeValue('alwaysNotify');
    }
    set alwaysNotify(value) {
        this.setAttribute('alwaysNotify', value);
    }
}
exports.SGField = SGField;
exports.SGFieldTypes = [
    'integer', 'int', 'longinteger', 'float', 'string', 'str', 'boolean', 'bool',
    'vector2d', 'color', 'time', 'uri', 'node', 'floatarray', 'intarray', 'boolarray',
    'stringarray', 'vector2darray', 'colorarray', 'timearray', 'nodearray', 'assocarray',
    'array', 'roarray', 'rect2d', 'rect2darray'
];
class SGFunction extends SGTag {
    constructor(tag = { text: 'function' }, attributes = [], range) {
        super(tag, attributes, range);
    }
    get name() {
        return this.getAttributeValue('name');
    }
    set name(value) {
        this.setAttribute('name', value);
    }
}
exports.SGFunction = SGFunction;
class SGInterface extends SGTag {
    constructor(tag = { text: 'interface' }, content, range) {
        super(tag, [], range);
        this.fields = [];
        this.functions = [];
        if (content) {
            for (const tag of content) {
                if ((0, xml_1.isSGField)(tag)) {
                    this.fields.push(tag);
                }
                else if ((0, xml_1.isSGFunction)(tag)) {
                    this.functions.push(tag);
                }
            }
        }
    }
    getField(id) {
        return this.fields.find(field => field.id === id);
    }
    setField(id, type, onChange, alwaysNotify, alias) {
        let field = this.getField(id);
        if (!field) {
            field = new SGField();
            field.id = id;
            this.fields.push(field);
        }
        field.type = type;
        field.onChange = onChange;
        if (alwaysNotify === undefined) {
            field.alwaysNotify = undefined;
        }
        else {
            field.alwaysNotify = alwaysNotify ? 'true' : 'false';
        }
        field.alias = alias;
    }
    getFunction(name) {
        return this.functions.find(field => field.name === name);
    }
    setFunction(name) {
        let func = this.getFunction(name);
        if (!func) {
            func = new SGFunction();
            func.name = name;
            this.functions.push(func);
        }
    }
    transpileBody(state) {
        const body = ['>\n'];
        state.blockDepth++;
        if (this.fields.length > 0) {
            body.push(...this.fields.map(node => node.transpile(state)));
        }
        if (this.functions.length > 0) {
            body.push(...this.functions.map(node => node.transpile(state)));
        }
        state.blockDepth--;
        body.push(state.indentText, '</', this.tag.text, '>\n');
        return body;
    }
}
exports.SGInterface = SGInterface;
class SGComponent extends SGTag {
    constructor(tag = { text: 'component' }, attributes, content, range) {
        super(tag, attributes, range);
        this.scripts = [];
        this.customizations = [];
        if (content) {
            for (const tag of content) {
                if ((0, xml_1.isSGInterface)(tag)) {
                    this.api = tag;
                }
                else if ((0, xml_1.isSGScript)(tag)) {
                    this.scripts.push(tag);
                }
                else if ((0, xml_1.isSGChildren)(tag)) {
                    this.children = tag;
                }
                else if ((0, xml_1.isSGCustomization)(tag)) {
                    this.customizations.push(tag);
                }
            }
        }
    }
    get name() {
        return this.getAttributeValue('name');
    }
    set name(value) {
        this.setAttribute('name', value);
    }
    get extends() {
        return this.getAttributeValue('extends');
    }
    set extends(value) {
        this.setAttribute('extends', value);
    }
    transpileBody(state) {
        const body = ['>\n'];
        state.blockDepth++;
        if (this.api) {
            body.push(this.api.transpile(state));
        }
        if (this.scripts.length > 0) {
            body.push(...this.scripts.map(node => node.transpile(state)));
        }
        if (this.children) {
            body.push(this.children.transpile(state));
        }
        if (this.customizations.length > 0) {
            body.push(...this.customizations.map(node => node.transpile(state)));
        }
        state.blockDepth--;
        body.push(state.indentText, '</', this.tag.text, '>\n');
        return body;
    }
}
exports.SGComponent = SGComponent;
class SGAst {
    constructor(prolog, root, component) {
        this.prolog = prolog;
        this.root = root;
        this.component = component;
    }
    transpile(state) {
        const chunks = [];
        //write XML prolog
        if (this.prolog) {
            chunks.push(this.prolog.transpile(state));
        }
        if (this.component) {
            //write content
            chunks.push(this.component.transpile(state));
        }
        return chunks;
    }
}
exports.SGAst = SGAst;
//# sourceMappingURL=SGTypes.js.map