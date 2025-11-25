"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Parser_1 = require("./Parser");
const reflection_1 = require("../astUtils/reflection");
describe('AnnotationExpression', () => {
    describe('getArguments', () => {
        function getArguments(text) {
            return Parser_1.Parser.parse(`
                @annotation(${text})
                function test()
                end function
            `).ast.findChild(reflection_1.isFunctionStatement).annotations[0].getArguments();
        }
        it('should return the value of a number', () => {
            (0, chai_1.expect)(getArguments('1')).to.eql([1]);
        });
        it('should return the value of a string', () => {
            (0, chai_1.expect)(getArguments('"hello"')).to.eql(['hello']);
        });
        it('should return the value of a boolean', () => {
            (0, chai_1.expect)(getArguments('true')).to.eql([true]);
        });
        it('should return the value of an object', () => {
            (0, chai_1.expect)(getArguments('{ a: 1 }')).to.eql([{ a: 1 }]);
        });
        it('should return the value of an array', () => {
            (0, chai_1.expect)(getArguments('[1, 2, 3]')).to.eql([
                [1, 2, 3]
            ]);
        });
        it('should return the value of a template string', () => {
            (0, chai_1.expect)(getArguments('`hello`')).to.eql(['hello']);
        });
        it('work with complex template string', () => {
            (0, chai_1.expect)(getArguments('`createObject("roSGNode", "BrsComponent")`')).to.eql([`createObject("roSGNode", "BrsComponent")`]);
        });
    });
});
//# sourceMappingURL=Expression.spec.js.map