"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const sinon_1 = require("sinon");
const reflection_1 = require("../../../astUtils/reflection");
const DiagnosticMessages_1 = require("../../../DiagnosticMessages");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Program_1 = require("../../../Program");
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('parser continue statements', () => {
    let program;
    let testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_2.rootDir, sourceMap: true });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    it('parses standalone statement properly', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                for i = 0 to 10
                    continue for
                end for
            end sub
        `);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        (0, chai_config_spec_1.expect)(file.ast.findChild(reflection_1.isContinueStatement)).to.exist;
    });
    it('flags incorrect loop type', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                for i = 0 to 10
                    continue while
                end for
                for each item in [1, 2, 3]
                    continue while
                end for
                while true
                    continue for
                end while
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.For),
            DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.For),
            DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.While)
        ]);
        (0, chai_config_spec_1.expect)(file.ast.findChild(reflection_1.isContinueStatement)).to.exist;
    });
    it('flags missing `for` or `while` but still creates the node', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                for i = 0 to 10
                    continue
                end for
            end sub
        `);
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.While, TokenKind_1.TokenKind.For)
        ]);
        (0, chai_config_spec_1.expect)(file.ast.findChild(reflection_1.isContinueStatement)).to.exist;
    });
    it('detects `continue` used outside of a loop', () => {
        program.setFile('source/main.bs', `
            sub main()
                continue for
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.illegalContinueStatement().message
        ]);
    });
    it('allows `continue` to be used as a local variable', () => {
        program.setFile('source/main.bs', `
            sub main()
                continue = true
                print continue
                if not continue then
                    print continue
                end if
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    it('transpiles properly', () => {
        testTranspile(`
            sub main()
                while true
                    continue while
                end while
                for i = 0 to 10
                    continue for
                end for
            end sub
        `);
    });
    it('does not crash when missing loop type', () => {
        program.plugins['suppressErrors'] = false;
        program.setFile('source/main.brs', `
            sub main()
                while true
                    continue
                end while
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.expectedToken(TokenKind_1.TokenKind.While, TokenKind_1.TokenKind.For).message
        ]);
    });
});
//# sourceMappingURL=Continue.spec.js.map