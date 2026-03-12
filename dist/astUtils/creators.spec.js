"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const creators_1 = require("./creators");
describe('creators', () => {
    describe('createStringLiteral', () => {
        it('wraps the value in quotes', () => {
            (0, chai_config_spec_1.expect)((0, creators_1.createStringLiteral)('hello world').token.text).to.equal('"hello world"');
        });
        it('does not wrap already-quoted value in extra quotes', () => {
            (0, chai_config_spec_1.expect)((0, creators_1.createStringLiteral)('"hello world"').token.text).to.equal('"hello world"');
        });
        it('does not wrap badly quoted value in additional quotes', () => {
            //leading
            (0, chai_config_spec_1.expect)((0, creators_1.createStringLiteral)('"hello world').token.text).to.equal('"hello world');
            //trailing
            (0, chai_config_spec_1.expect)((0, creators_1.createStringLiteral)('hello world"').token.text).to.equal('hello world"');
        });
    });
});
//# sourceMappingURL=creators.spec.js.map