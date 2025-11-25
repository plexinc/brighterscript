"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const FunctionScope_1 = require("./FunctionScope");
const Program_1 = require("./Program");
describe('FunctionScope', () => {
    let scope;
    let rootDir = process.cwd();
    let program;
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: rootDir });
        scope = new FunctionScope_1.FunctionScope(null);
    });
    afterEach(() => {
        program.dispose();
    });
    describe('getVariablesAbove', () => {
        it('returns empty array when there are no variables found', () => {
            let variables = scope.getVariablesAbove(10);
            (0, chai_config_spec_1.expect)(variables).to.be.lengthOf(0);
        });
        it('returns variables defined above the specified line number', () => {
            let file = program.setFile('source/main.brs', `
                sub main()
                    var1 = 1
                    var2 = 2
                    var3 = 3
                end sub
            `);
            (0, chai_config_spec_1.expect)(file.functionScopes[0].getVariablesAbove(2)).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(file.functionScopes[0].getVariablesAbove(3)).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(file.functionScopes[0].getVariablesAbove(3)[0].name).to.equal('var1');
            (0, chai_config_spec_1.expect)(file.functionScopes[0].getVariablesAbove(4)).to.be.lengthOf(2);
        });
    });
});
//# sourceMappingURL=FunctionScope.spec.js.map