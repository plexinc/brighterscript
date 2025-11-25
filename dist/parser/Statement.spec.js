"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const Statement_1 = require("./Statement");
const Parser_1 = require("./Parser");
const visitors_1 = require("../astUtils/visitors");
const reflection_1 = require("../astUtils/reflection");
const vscode_languageserver_1 = require("vscode-languageserver");
const Program_1 = require("../Program");
const testHelpers_spec_1 = require("../testHelpers.spec");
const testHelpers_spec_2 = require("../testHelpers.spec");
describe('Statement', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({
            cwd: testHelpers_spec_2.tempDir
        });
    });
    describe('EmptyStatement', () => {
        it('returns empty array for transpile', () => {
            const statement = new Statement_1.EmptyStatement();
            (0, chai_config_spec_1.expect)(statement.transpile({})).to.eql([]);
        });
        it('does nothing for walkAll', () => {
            const statement = new Statement_1.EmptyStatement();
            statement.walk(() => {
                (0, chai_config_spec_1.expect)(true).to.be.false;
            }, { walkMode: visitors_1.WalkMode.visitAllRecursive });
        });
    });
    describe('Body', () => {
        it('initializes statements array if none provided', () => {
            const body = new Statement_1.Body();
            (0, chai_config_spec_1.expect)(body.statements).to.eql([]);
        });
    });
    describe('NamespaceStatement', () => {
        it('getName() works', () => {
            const parser = Parser_1.Parser.parse(`
                namespace NameA.NameB
                end namespace
            `);
            const statement = parser.ast.statements[0];
            (0, chai_config_spec_1.expect)(statement.getName(Parser_1.ParseMode.BrighterScript)).to.equal('NameA.NameB');
            (0, chai_config_spec_1.expect)(statement.getName(Parser_1.ParseMode.BrightScript)).to.equal('NameA_NameB');
        });
        it('getName() works', () => {
            program.setFile('source/main.brs', `
                namespace NameA
                    namespace NameB
                        sub main()
                        end sub
                    end namespace
                end namespace
            `);
            program.validate();
            let node = program.getFile('source/main.brs').ast.findChild(reflection_1.isNamespaceStatement);
            while (node.findChild(reflection_1.isNamespaceStatement)) {
                node = node.findChild(reflection_1.isNamespaceStatement);
            }
            (0, chai_config_spec_1.expect)(node.getName(Parser_1.ParseMode.BrighterScript)).to.equal('NameA.NameB');
            (0, chai_config_spec_1.expect)(node.getName(Parser_1.ParseMode.BrightScript)).to.equal('NameA_NameB');
        });
    });
    describe('CommentStatement', () => {
        describe('walk', () => {
            it('skips visitor if canceled', () => {
                const comment = new Statement_1.CommentStatement([]);
                const cancel = new vscode_languageserver_1.CancellationTokenSource();
                cancel.cancel();
                comment.walk(() => {
                    throw new Error('Should not have been called');
                }, { walkMode: visitors_1.WalkMode.visitAllRecursive, cancel: cancel.token });
            });
        });
    });
    describe('ClassStatement', () => {
        describe('getName', () => {
            it('handles null namespace name', () => {
                const file = program.setFile('source/lib.bs', `
                    class Animal
                    end class
                `);
                program.validate();
                const stmt = file.parser.references.classStatements[0];
                (0, chai_config_spec_1.expect)(stmt.getName(Parser_1.ParseMode.BrightScript)).to.equal('Animal');
                (0, chai_config_spec_1.expect)(stmt.getName(Parser_1.ParseMode.BrighterScript)).to.equal('Animal');
            });
            it('handles namespaces', () => {
                const file = program.setFile('source/lib.bs', `
                    namespace NameA
                        class Animal
                        end class
                    end namespace
                `);
                program.validate();
                const stmt = file.parser.references.classStatements[0];
                (0, chai_config_spec_1.expect)(stmt.getName(Parser_1.ParseMode.BrightScript)).to.equal('NameA_Animal');
                (0, chai_config_spec_1.expect)(stmt.getName(Parser_1.ParseMode.BrighterScript)).to.equal('NameA.Animal');
            });
        });
    });
    describe('ImportStatement', () => {
        describe('getTypedef', () => {
            it('changes .bs file extensions to .brs', () => {
                const file = program.setFile('source/main.bs', `
                    import "lib1.bs"
                    import "pkg:/source/lib2.bs"
                `);
                (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim) `${file.getTypedef()}`).to.eql((0, testHelpers_spec_1.trim) `
                    import "lib1.brs"
                    import "pkg:/source/lib2.brs"
                `);
            });
        });
    });
});
//# sourceMappingURL=Statement.spec.js.map