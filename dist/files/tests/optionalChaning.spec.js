"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinonImport = require("sinon");
const fsExtra = require("fs-extra");
const Program_1 = require("../../Program");
const testHelpers_spec_1 = require("../../testHelpers.spec");
const testHelpers_spec_2 = require("../../testHelpers.spec");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const util_1 = require("../../util");
let sinon = sinonImport.createSandbox();
describe('optional chaining', () => {
    let program;
    const testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        fsExtra.ensureDirSync(testHelpers_spec_2.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir,
            stagingDir: testHelpers_spec_2.stagingDir
        });
    });
    afterEach(() => {
        sinon.restore();
        fsExtra.ensureDirSync(testHelpers_spec_2.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program.dispose();
    });
    it('transpiles ?. properly', () => {
        testTranspile(`
            sub main()
                print m?.value
            end sub
        `);
    });
    it('transpiles ?[ properly', () => {
        testTranspile(`
            sub main()
                print m?["value"]
            end sub
        `);
    });
    it(`transpiles '?.[`, () => {
        testTranspile(`
            sub main()
                print m?["value"]
            end sub
        `);
    });
    it(`transpiles '?@`, () => {
        testTranspile(`
            sub main()
                someXml = invalid
                print someXml?@someAttr
            end sub
        `);
    });
    it(`transpiles '?(`, () => {
        testTranspile(`
            sub main()
                localFunc = sub()
                end sub
                print localFunc?()
                print m.someFunc?()
            end sub
        `);
    });
    it('transpiles various use cases', () => {
        testTranspile(`
            sub main()
                obj = {}
                arr = []
                print arr?.["0"]
                print arr?.value
                print obj?.[0]
                print obj?.getName()?.first?.second
                print createObject("roByteArray")?.value
                print createObject("roByteArray")?["0"]
                print createObject("roList")?.value
                print createObject("roList")?["0"]
                print createObject("roXmlList")?["0"]
                print createObject("roDateTime")?.value
                print createObject("roDateTime")?.GetTimeZoneOffset
                print createObject("roSGNode", "Node")?[0]
                print obj?.first?.second
                print obj?.first?.second
                print obj.b.xmlThing?@someAttr
                print obj.b.localFunc?()
            end sub
        `);
    });
    it('includes final operator in chain', () => {
        testTranspile(`
            sub main()
                if m.cardFolderStack <> invalid then
                    m?.cardFolderStack?.visible?.ither = false
                end if
            end sub
        `, undefined, undefined, undefined, false);
    });
    describe('disallows optional chaining on left-hand-side of assignments', () => {
        it('catches simple dotted set', () => {
            program.setFile('source/main.bs', `
                sub main()
                    m?.a = true
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(2, 20, 2, 24) })]);
        });
        it('catches complex dotted set', () => {
            program.setFile('source/main.bs', `
                sub main()
                    m?.a.b?.c = true
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(2, 20, 2, 29) })]);
        });
        it('catches simple indexed set', () => {
            program.setFile('source/main.bs', `
                sub main()
                    arr = []
                    arr?[1] = true
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(3, 20, 3, 27) })]);
        });
        it('catches complex indexed set', () => {
            program.setFile('source/main.bs', `
                sub main()
                    arr = []
                    arr[2]?[3] = true
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(3, 20, 3, 30) })]);
        });
        it('catches very complex dotted and indexed sets', () => {
            program.setFile('source/main.bs', `
                sub main()
                    arr = []
                    arr[5][6][7]?.thing = true
                    m.a.b.c.d?[8] = true
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(3, 20, 3, 39) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.noOptionalChainingInLeftHandSideOfAssignment()), { range: util_1.default.createRange(4, 20, 4, 33) })]);
        });
    });
});
//# sourceMappingURL=optionalChaning.spec.js.map