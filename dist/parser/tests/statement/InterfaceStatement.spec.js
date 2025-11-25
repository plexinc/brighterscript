"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const Program_1 = require("../../../Program");
describe('InterfaceStatement', () => {
    let program;
    const testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    const testGetTypedef = (0, testHelpers_spec_1.getTestGetTypedef)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir
        });
    });
    it('allows strange keywords as property names', () => {
        testGetTypedef(`
            interface Person
                public as string
                protected as string
                private as string
                sub as string
                function as string
                interface as string
                endInterface as string
            end interface
        `, undefined, undefined, undefined, true);
    });
    it('allows strange keywords as method names', () => {
        testGetTypedef(`
            interface Person
                sub public() as string
                sub protected() as string
                sub private() as string
                sub sub() as string
                sub function() as string
                sub interface() as string
                sub endInterface() as string
            end interface
        `, undefined, undefined, undefined, true);
    });
    it('includes comments', () => {
        testGetTypedef(`
            interface Person
                'some comment
                sub someFunc() as string
            end interface
        `, undefined, undefined, undefined, true);
    });
    it('includes annotations', () => {
        testGetTypedef(`
            @IFace
            interface Person
                @Method
                sub someFunc() as string
                @Field
                someField as string
            end interface
        `, undefined, undefined, undefined, true);
    });
    it('allows declaring multiple interfaces in a file', () => {
        program.setFile('source/interfaces.bs', `
            interface Iface1
                name as dynamic
            end interface
            interface IFace2
                prop as dynamic
            end interface
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    it('allows comments after an interface', () => {
        testTranspile(`
            interface Iface1
                name as dynamic
            end interface
            'this comment was throwing exception during transpile
            interface IFace2
                prop as dynamic
            end interface
        `, `
            'this comment was throwing exception during transpile
        `);
    });
    it('allows parameters in interface method signatures', () => {
        testGetTypedef(`
            interface Person
                sub someFunc(name as string, age as integer) as string
                someField as string
            end interface
        `, undefined, undefined, undefined, true);
    });
    it('supports empty interfaces', () => {
        const file = program.setFile('source/main.bs', `
           interface SomeInterface
           end interface
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(file);
    });
});
//# sourceMappingURL=InterfaceStatement.spec.js.map