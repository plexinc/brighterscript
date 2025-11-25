"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const Program_1 = require("../../../Program");
const sinon_1 = require("sinon");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('ForEachStatement', () => {
    let program;
    let testTranspile = (0, testHelpers_spec_2.getTestTranspile)(() => [program, testHelpers_spec_1.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_1.rootDir, sourceMap: true });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    it('transpiles a simple loop', () => {
        testTranspile(`
            sub doLoop(data)
                for each i in data
                    print i
                end for
            end sub
        `);
    });
    it('adds newline to end of empty loop declaration', () => {
        testTranspile(`
            sub doLoop(data)
                for each i in data
                end for
            end sub
        `);
    });
});
//# sourceMappingURL=ForEach.spec.js.map