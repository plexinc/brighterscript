"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const BrsTranspileState_1 = require("../parser/BrsTranspileState");
const AstEditor_1 = require("./AstEditor");
const util_1 = require("../util");
const creators_1 = require("../astUtils/creators");
const TokenKind_1 = require("../lexer/TokenKind");
const Program_1 = require("../Program");
const BrsFile_1 = require("../files/BrsFile");
const Expression_1 = require("../parser/Expression");
const source_map_1 = require("source-map");
describe('AstEditor', () => {
    let editor;
    let obj;
    beforeEach(() => {
        editor = new AstEditor_1.AstEditor();
        obj = getTestObject();
    });
    function getTestObject() {
        return {
            name: 'parent',
            hobbies: ['gaming', 'reading', 'cycling'],
            children: [{
                    name: 'oldest',
                    age: 15
                }, {
                    name: 'middle',
                    age: 10
                }, {
                    name: 'youngest',
                    age: 5
                }],
            jobs: [{
                    title: 'plumber',
                    annualSalary: 50000
                }, {
                    title: 'carpenter',
                    annualSalary: 75000
                }]
        };
    }
    it('applies single property change', () => {
        (0, chai_config_spec_1.expect)(obj.name).to.eql('parent');
        editor.setProperty(obj, 'name', 'jack');
        (0, chai_config_spec_1.expect)(obj.name).to.eql('jack');
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.name).to.eql('parent');
    });
    it('inserts at beginning of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.addToArray(obj.hobbies, 0, 'climbing');
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['climbing', 'gaming', 'reading', 'cycling']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('inserts at middle of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.addToArray(obj.hobbies, 1, 'climbing');
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'climbing', 'reading', 'cycling']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('changes the value at an array index', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.setArrayValue(obj.hobbies, 1, 'sleeping');
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'sleeping', 'cycling']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('inserts at end of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.addToArray(obj.hobbies, 3, 'climbing');
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling', 'climbing']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('removes at beginning of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.removeFromArray(obj.hobbies, 0);
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['reading', 'cycling']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('removes at middle of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.removeFromArray(obj.hobbies, 1);
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'cycling']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('removes at middle of array', () => {
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
        editor.removeFromArray(obj.hobbies, 2);
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading']);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('restores array after being removed', () => {
        editor.removeFromArray(obj.hobbies, 0);
        editor.setProperty(obj, 'hobbies', undefined);
        (0, chai_config_spec_1.expect)(obj.hobbies).to.be.undefined;
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj.hobbies).to.eql(['gaming', 'reading', 'cycling']);
    });
    it('works for many changes', () => {
        (0, chai_config_spec_1.expect)(obj).to.eql(getTestObject());
        editor.setProperty(obj, 'name', 'bob');
        editor.setProperty(obj.children[0], 'name', 'jimmy');
        editor.addToArray(obj.children, obj.children.length, { name: 'sally', age: 1 });
        editor.removeFromArray(obj.jobs, 1);
        editor.removeFromArray(obj.hobbies, 0);
        editor.removeFromArray(obj.hobbies, 0);
        editor.removeFromArray(obj.hobbies, 0);
        editor.setProperty(obj, 'hobbies', undefined);
        (0, chai_config_spec_1.expect)(obj).to.eql({
            name: 'bob',
            hobbies: undefined,
            children: [{
                    name: 'jimmy',
                    age: 15
                }, {
                    name: 'middle',
                    age: 10
                }, {
                    name: 'youngest',
                    age: 5
                }, {
                    name: 'sally',
                    age: 1
                }],
            jobs: [{
                    title: 'plumber',
                    annualSalary: 50000
                }]
        });
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj).to.eql(getTestObject());
    });
    describe('overrideTranspileResult', () => {
        const state = new BrsTranspileState_1.BrsTranspileState(new BrsFile_1.BrsFile('', '', new Program_1.Program({})));
        function transpileToString(transpilable) {
            if (transpilable.transpile) {
                const result = transpilable.transpile(state);
                if (Array.isArray(result)) {
                    return new source_map_1.SourceNode(null, null, null, result).toString();
                }
            }
        }
        it('overrides existing transpile method', () => {
            const expression = new Expression_1.LiteralExpression((0, creators_1.createToken)(TokenKind_1.TokenKind.IntegerLiteral, 'original'));
            (0, chai_config_spec_1.expect)(transpileToString(expression)).to.eql('original');
            editor.overrideTranspileResult(expression, 'replaced');
            (0, chai_config_spec_1.expect)(transpileToString(expression)).to.eql('replaced');
            editor.undoAll();
            (0, chai_config_spec_1.expect)(transpileToString(expression)).to.eql('original');
        });
        it('gracefully handles missing transpile method', () => {
            const expression = {
                range: util_1.util.createRange(1, 2, 3, 4)
            };
            (0, chai_config_spec_1.expect)(expression.transpile).not.to.exist;
            editor.overrideTranspileResult(expression, 'replaced');
            (0, chai_config_spec_1.expect)(transpileToString(expression)).to.eql('replaced');
            editor.undoAll();
            (0, chai_config_spec_1.expect)(expression.transpile).not.to.exist;
        });
    });
    it('arrayPush works', () => {
        const array = [1, 2, 3];
        editor.arrayPush(array, 4);
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2, 3, 4]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2, 3]);
    });
    it('arrayPop works', () => {
        const array = [1, 2, 3];
        (0, chai_config_spec_1.expect)(editor.arrayPop(array)).to.eql(3);
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2, 3]);
    });
    it('arrayShift works', () => {
        const array = [1, 2, 3];
        (0, chai_config_spec_1.expect)(editor.arrayShift(array)).to.eql(1);
        (0, chai_config_spec_1.expect)(array).to.eql([2, 3]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2, 3]);
    });
    it('arrayUnshift works at beginning', () => {
        const array = [1, 2, 3];
        editor.arrayUnshift(array, -1, 0);
        (0, chai_config_spec_1.expect)(array).to.eql([-1, 0, 1, 2, 3]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(array).to.eql([1, 2, 3]);
    });
    it('removeProperty removes existing property', () => {
        const obj = {
            name: 'bob'
        };
        editor.removeProperty(obj, 'name');
        (0, chai_config_spec_1.expect)(obj).not.haveOwnProperty('name');
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj).haveOwnProperty('name');
    });
    it('removeProperty leaves non-present property as non-present after undo', () => {
        const obj = {};
        editor.removeProperty(obj, 'name');
        (0, chai_config_spec_1.expect)(obj).not.haveOwnProperty('name');
        editor.undoAll();
        (0, chai_config_spec_1.expect)(obj).not.haveOwnProperty('name');
    });
    it('arraySplice works properly at beginning', () => {
        const arr = [1, 2, 3];
        editor.arraySplice(arr, 0, 2, -1, 0);
        (0, chai_config_spec_1.expect)(arr).to.eql([-1, 0, 3]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(arr).to.eql([1, 2, 3]);
    });
    it('arraySplice works properly at the middle', () => {
        const arr = [1, 2, 3];
        editor.arraySplice(arr, 1, 2, 4, 5);
        (0, chai_config_spec_1.expect)(arr).to.eql([1, 4, 5]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(arr).to.eql([1, 2, 3]);
    });
    it('arraySplice works properly at the end', () => {
        const arr = [1, 2, 3];
        editor.arraySplice(arr, 3, 2, 4, 5);
        (0, chai_config_spec_1.expect)(arr).to.eql([1, 2, 3, 4, 5]);
        editor.undoAll();
        (0, chai_config_spec_1.expect)(arr).to.eql([1, 2, 3]);
    });
    it('edit works', () => {
        const testObj = getTestObject();
        editor.edit((data) => {
            data.oldValue = testObj.name;
            testObj.name = 'new name';
        }, (data) => {
            testObj.name = data.oldValue;
        });
        (0, chai_config_spec_1.expect)(testObj.name).to.eql('new name');
        editor.undoAll();
        (0, chai_config_spec_1.expect)(testObj.name).to.eql(getTestObject().name);
    });
    it('edit handles missing functions', () => {
        //missing undo
        editor.edit((data) => { }, undefined);
        //missing edit
        editor.edit(undefined, (data) => { });
        //test passes if no exceptions were thrown
    });
});
//# sourceMappingURL=AstEditor.spec.js.map