"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const pick = require("object.pick");
const sinonImport = require("sinon");
const vscode_languageserver_1 = require("vscode-languageserver");
const fsExtra = require("fs-extra");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const Program_1 = require("./Program");
const util_1 = require("./util");
const vscode_uri_1 = require("vscode-uri");
const PluginInterface_1 = require("./PluginInterface");
const Statement_1 = require("./parser/Statement");
const testHelpers_spec_1 = require("./testHelpers.spec");
const assert_1 = require("assert");
const visitors_1 = require("./astUtils/visitors");
const reflection_1 = require("./astUtils/reflection");
const testHelpers_spec_2 = require("./testHelpers.spec");
const logging_1 = require("./logging");
const Scope_1 = require("./Scope");
const undent_1 = require("undent");
let sinon = sinonImport.createSandbox();
describe('Program', () => {
    let program;
    beforeEach(() => {
        fsExtra.ensureDirSync(testHelpers_spec_2.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir,
            stagingDir: testHelpers_spec_2.stagingDir
        });
        program.createSourceScope(); //ensure source scope is created
    });
    afterEach(() => {
        sinon.restore();
        fsExtra.ensureDirSync(testHelpers_spec_2.tempDir);
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        program.dispose();
    });
    it('does not throw exception after calling validate() after dispose()', () => {
        program.setFile('source/themes/alpha.bs', `
            sub main()
            end sub
        `);
        program.dispose();
        program.validate();
    });
    it('Does not crash for file not referenced by any other scope', async () => {
        program.setFile('tests/testFile.spec.bs', `
            function main(args as object) as object
                return roca(args).describe("test suite", sub()
                    m.pass()
                end sub)
            end function
        `);
        program.validate();
        //test passes if this line does not throw
        await program.getTranspiledFileContents('tests/testFile.spec.bs');
    });
    describe('global scope', () => {
        it('returns all callables when asked', () => {
            (0, chai_config_spec_1.expect)(program.globalScope.getAllCallables().length).to.be.greaterThan(0);
        });
        it('validate gets called and does nothing', () => {
            (0, chai_config_spec_1.expect)(program.globalScope.validate()).to.eql(undefined);
        });
    });
    describe('addFile', () => {
        it('adds various files to `pkgMap`', () => {
            program.setFile('source/main.brs', '');
            (0, chai_config_spec_1.expect)(program['pkgMap']).to.have.property((0, util_1.standardizePath) `source/main.brs`);
            program.setFile('source/main.bs', '');
            (0, chai_config_spec_1.expect)(program['pkgMap']).to.have.property((0, util_1.standardizePath) `source/main.bs`);
            program.setFile('components/comp1.xml', '');
            (0, chai_config_spec_1.expect)(program['pkgMap']).to.have.property((0, util_1.standardizePath) `components/comp1.xml`);
        });
        it('does not crash when given a totally bogus file', () => {
            program.setFile('source/main.brs', `class Animalpublic name as stringpublic function walk()end functionend class`);
            //if the program didn't get stuck in an infinite loop, this test passes
        });
        it('flags unsupported statements at root of file', () => {
            program.setFile('source/main.brs', `
                result = true
                print true
                createObject("roSGNode", "Rectangle")
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedStatementOutsideFunction()), Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedStatementOutsideFunction()), Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.unexpectedStatementOutsideFunction())]);
        });
        it('only parses xml files as components when file is found within the "components" folder', () => {
            (0, chai_config_spec_1.expect)(Object.keys(program.files).length).to.equal(0);
            program.setFile('components/comp1.xml', '');
            (0, chai_config_spec_1.expect)(Object.keys(program.files).length).to.equal(1);
            program.setFile('notComponents/comp1.xml', '');
            (0, chai_config_spec_1.expect)(Object.keys(program.files).length).to.equal(1);
            program.setFile('componentsExtra/comp1.xml', '');
            (0, chai_config_spec_1.expect)(Object.keys(program.files).length).to.equal(1);
        });
        it('supports empty statements for transpile', async () => {
            const file = program.setFile('source/main.bs', `
                sub main()
                    m.logError()
                    'some comment
                end sub
            `);
            file.parser.ast.statements[0].func.body.statements[0] = new Statement_1.EmptyStatement();
            await program.transpile([{ src: file.srcPath, dest: file.pkgPath }], testHelpers_spec_2.tempDir);
        });
        it('works with different cwd', () => {
            let projectDir = (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/project2`;
            fsExtra.ensureDirSync(projectDir);
            program = new Program_1.Program({ cwd: projectDir });
            program.setFile('source/lib.brs', 'function main()\n    print "hello world"\nend function');
            // await program.reloadFile('source/lib.brs', `'this is a comment`);
            //if we made it to here, nothing exploded, so the test passes
        });
        it(`adds files in the source folder to the 'source' scope`, () => {
            (0, chai_config_spec_1.expect)(program.getScopeByName('source')).to.exist;
            //no files in source scope
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getOwnFiles().length).to.equal(0);
            //add a new source file
            program.setFile('source/main.brs', '');
            //file should be in source scope now
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getFile('source/main.brs')).to.exist;
            //add an unreferenced file from the components folder
            program.setFile('components/component1/component1.brs', '');
            //source scope should have the same number of files
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getFile('source/main.brs')).to.exist;
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getFile(`${testHelpers_spec_2.rootDir}/components/component1/component1.brs`)).not.to.exist;
        });
        it('normalizes file paths', () => {
            program.setFile('source/main.brs', '');
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getFile('source/main.brs')).to.exist;
            //shouldn't throw an exception because it will find the correct path after normalizing the above path and remove it
            try {
                program.removeFile('source/main.brs');
                //no error
            }
            catch (e) {
                chai_config_spec_1.assert.fail(null, null, 'Should not have thrown exception');
            }
        });
        it('creates a scope for every component xml file', () => {
            // let componentPath = path.resolve(`${rootDir}/components/component1.xml`);
            // await program.loadOrReloadFile('components', '')
        });
        it(`emits events for scope and file creation`, () => {
            const beforeProgramValidate = sinon.spy();
            const afterProgramValidate = sinon.spy();
            const afterScopeCreate = sinon.spy();
            const beforeScopeValidate = sinon.spy();
            const afterScopeValidate = sinon.spy();
            const beforeFileParse = sinon.spy();
            const afterFileParse = sinon.spy();
            const afterFileValidate = sinon.spy();
            program.plugins = new PluginInterface_1.default([{
                    name: 'emits events for scope and file creation',
                    beforeProgramValidate: beforeProgramValidate,
                    afterProgramValidate: afterProgramValidate,
                    afterScopeCreate: afterScopeCreate,
                    beforeScopeValidate: beforeScopeValidate,
                    afterScopeValidate: afterScopeValidate,
                    beforeFileParse: beforeFileParse,
                    afterFileParse: afterFileParse,
                    afterFileValidate: afterFileValidate
                }], { logger: (0, logging_1.createLogger)() });
            //add a new source file
            program.setFile('source/main.brs', '');
            //add a component file
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/lib.brs" />
                </component>`);
            program.validate();
            //program events
            (0, chai_config_spec_1.expect)(beforeProgramValidate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(afterProgramValidate.callCount).to.equal(1);
            //scope events
            //(we get component scope event only because source is created in beforeEach)
            (0, chai_config_spec_1.expect)(afterScopeCreate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(beforeScopeValidate.callCount).to.equal(2);
            (0, chai_config_spec_1.expect)(afterScopeValidate.callCount).to.equal(2);
            //file events
            (0, chai_config_spec_1.expect)(beforeFileParse.callCount).to.equal(2);
            (0, chai_config_spec_1.expect)(afterFileParse.callCount).to.equal(2);
            (0, chai_config_spec_1.expect)(afterFileValidate.callCount).to.equal(2);
        });
    });
    describe('validate', () => {
        it('does not lose scope diagnostics in second validation after cancelling the previous validation', async () => {
            program.setFile('source/Direction.bs', `
                enum Direction
                    up = "up"
                end enum
            `);
            program.setFile('source/test.bs', `
                import "Direction.bs"
                sub test()
                    print Direction.down
                end sub
            `);
            //add several scopes so we have time to cancel the validation
            for (let i = 0; i < 3; i++) {
                program.setFile(`components/Component${i}.xml`, (0, undent_1.default) `
                    <component name="Component${i}" extends="Group">
                        <script uri="pkg:/source/test.bs" />
                    </component>
                `);
            }
            program.validate();
            //ensure the diagnostic is there during normal run
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('down', 'Direction').message
            ]);
            const cancel = new vscode_languageserver_1.CancellationTokenSource();
            let count = 0;
            const plugin = {
                name: 'cancel validation',
                beforeProgramValidate: () => {
                    count++;
                    //if this is the second validate, remove the plugin and change the file to invalidate the scopes again
                    if (count === 2) {
                        program.plugins.remove(plugin);
                        program.setFile('source/test.bs', program.getFile('source/test.bs').fileContents + `'comment`);
                    }
                },
                afterScopeValidate: () => {
                    //if the diagnostic is avaiable, we know it's safe to cancel
                    if (program.getDiagnostics().find(x => x.code === DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('down', 'Direction').code)) {
                        cancel.cancel();
                    }
                }
            };
            //add a plugin that monitors where we are in the process, so we can cancel the validate at the correct time
            program.plugins.add(plugin);
            //change the file so it forces a reload
            program.setFile('source/test.bs', program.getFile('source/test.bs').fileContents + `'comment`);
            //now trigger two validations, the first one will be cancelled, the second one will run to completion
            await Promise.all([
                program.validate({
                    async: true,
                    cancellationToken: cancel.token
                }),
                program.validate({
                    async: true
                })
            ]);
            //ensure the diagnostic is there after a cancelled run (with a subsequent completed run)
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.unknownEnumValue('down', 'Direction').message
            ]);
        });
        it('validate (sync) passes along inner exception', () => {
            program.setFile('source/main.brs', ``);
            sinon.stub(Scope_1.Scope.prototype, 'validate').callsFake(() => {
                throw new Error('Scope crash');
            });
            (0, testHelpers_spec_1.expectThrows)(() => {
                program.validate();
            }, 'Scope crash');
        });
        it('validate (async) passes along inner exception', async () => {
            program.setFile('source/main.brs', ``);
            sinon.stub(Scope_1.Scope.prototype, 'validate').callsFake(() => {
                throw new Error('Scope crash');
            });
            await (0, testHelpers_spec_1.expectThrowsAsync)(async () => {
                await program.validate({
                    async: true
                });
            }, 'Scope crash');
        });
        it('retains expressions after validate', () => {
            const file = program.setFile('source/main.bs', `
                sub test()
                    print a.b.c
                end sub
            `);
            //disable the plugins
            (0, chai_config_spec_1.expect)(file.parser.references.expressions).to.be.lengthOf(1);
            program.validate();
            (0, chai_config_spec_1.expect)(file.parser.references.expressions).to.be.lengthOf(1);
        });
        it('catches duplicate XML component names', () => {
            //add 2 components which both reference the same errored file
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                </component>
            `);
            program.setFile('components/component2.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateComponentName('Component1')), { range: vscode_languageserver_1.Range.create(1, 17, 1, 27), relatedInformation: [{
                            location: util_1.util.createLocation(vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/component1.xml`).toString(), vscode_languageserver_1.Range.create(1, 17, 1, 27)),
                            message: 'Also defined here'
                        }] }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.duplicateComponentName('Component1')), { range: vscode_languageserver_1.Range.create(1, 17, 1, 27), relatedInformation: [{
                            location: util_1.util.createLocation(vscode_uri_1.URI.file((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/component2.xml`).toString(), vscode_languageserver_1.Range.create(1, 17, 1, 27)),
                            message: 'Also defined here'
                        }] })]);
        });
        it('allows adding diagnostics', () => {
            const expected = [{
                    message: 'message',
                    file: undefined,
                    range: undefined
                }];
            program.addDiagnostics(expected);
            const actual = program.diagnostics;
            (0, chai_config_spec_1.expect)(actual).to.deep.equal(expected);
        });
        it('does not produce duplicate parse errors for different component scopes', () => {
            //add a file with a parse error
            program.setFile('components/lib.brs', `
                sub DoSomething()
                    'random out-of-place open paren, definitely causes parse error
                    (
                end sub
            `);
            //add 2 components which both reference the same errored file
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/lib.brs" />
                </component>
            `);
            program.setFile('components/component2.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component2" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/lib.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectHasDiagnostics)(program, 1);
        });
        it('detects scripts not loaded by any file', () => {
            //add a main file for sanity check
            program.setFile('source/main.brs', '');
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            //add the orphaned file
            program.setFile('components/lib.brs', '');
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.fileNotReferencedByAnyOtherFile()
            ]);
        });
        it('does not throw errors on shadowed init functions in components', () => {
            program.setFile('lib.brs', `
                function DoSomething()
                    return true
                end function
            `);
            program.setFile('components/Parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Parent" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/lib.brs" />
                </component>
            `);
            program.setFile('components/Child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Child" extends="Parent">
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('recognizes global function calls', () => {
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            program.setFile('source/file.brs', `
                function DoB()
                    sleep(100)
                end function
            `);
            //validate the scope
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('shows warning when a child component imports the same script as its parent', () => {
            program.setFile('components/parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/lib.brs" />
                </component>
            `);
            program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="pkg:/lib.brs" />
                </component>
            `);
            program.setFile('lib.brs', `'comment`);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.unnecessaryScriptImportInChildFromParent('ParentScene')
            ]);
        });
        it('adds info diag when child component method shadows parent component method', () => {
            program.setFile('components/parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/parent.brs" />
                </component>
            `);
            program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="pkg:/child.brs" />
                </component>
            `);
            program.setFile('parent.brs', `sub DoSomething()\nend sub`);
            program.setFile('child.brs', `sub DoSomething()\nend sub`);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.overridesAncestorFunction('', '', '', '').code
            ]);
        });
        it('does not add info diagnostic on shadowed "init" functions', () => {
            program.setFile('components/parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                    <script type="text/brightscript" uri="parent.brs" />
                </component>
                `);
            program.setFile(`components/parent.brs`, `sub Init()\nend sub`);
            program.setFile(`components/child.brs`, `sub Init()\nend sub`);
            program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="child.brs" />
                </component>
            `);
            //run this validate separately so we can have an easier time debugging just the child component
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('catches duplicate methods in single file', () => {
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
                sub DoSomething()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.duplicateFunctionImplementation('DoSomething', 'source'),
                DiagnosticMessages_1.DiagnosticMessages.duplicateFunctionImplementation('DoSomething', 'source')
            ]);
        });
        it('catches duplicate methods across multiple files', () => {
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
            `);
            program.setFile('source/lib.brs', `
                sub DoSomething()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.duplicateFunctionImplementation('DoSomething', 'source'),
                DiagnosticMessages_1.DiagnosticMessages.duplicateFunctionImplementation('DoSomething', 'source')
            ]);
        });
        it('maintains correct callables list', () => {
            let initialCallableCount = program.getScopeByName('source').getAllCallables().length;
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
                sub DoSomething()
                end sub
            `);
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getAllCallables().length).equals(initialCallableCount + 2);
            //set the file contents again (resetting the wasProcessed flag)
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
                sub DoSomething()
                end sub
                `);
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getAllCallables().length).equals(initialCallableCount + 2);
            program.removeFile(`${testHelpers_spec_2.rootDir}/source/main.brs`);
            (0, chai_config_spec_1.expect)(program.getScopeByName('source').getAllCallables().length).equals(initialCallableCount);
        });
        it('resets errors on revalidate', () => {
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
                sub DoSomething()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectHasDiagnostics)(program, 2);
            //set the file contents again (resetting the wasProcessed flag)
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
                sub DoSomething()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectHasDiagnostics)(program, 2);
            //load in a valid file, the errors should go to zero
            program.setFile('source/main.brs', `
                sub DoSomething()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('identifies invocation of unknown function', () => {
            //call a function that doesn't exist
            program.setFile('source/main.brs', `
                sub Main()
                    name = "Hello"
                    DoSomething(name)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction('DoSomething')
            ]);
        });
        it('supports using vars defined in nested if statements', () => {
            //call a function that doesn't exist
            program.setFile({ src: `${testHelpers_spec_2.rootDir}/source/main.brs`, dest: 'source/main.brs' }, `
                sub Main()
                    if true
                        name = "bob"
                    end if
                    print name
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('supports using `m` vars in parameter default values', () => {
            //call a function that doesn't exist
            program.setFile({ src: `${testHelpers_spec_2.rootDir}/source/main.brs`, dest: 'source/main.brs' }, `
                function findNode(nodeId as string, parentNode = m.top as object)
                    return parentNode.findNode(nodeId)
                end function
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('detects methods from another file in a subdirectory', () => {
            program.setFile('source/main.brs', `
                sub Main()
                    DoSomething()
                end sub
            `);
            program.setFile('source/ui/lib.brs', `
                function DoSomething()
                    print "hello world"
                end function
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('properly handles errors in async mode', async () => {
            const file = program.setFile('source/main.brs', ``);
            file.validate = () => {
                throw new Error('Crash for test');
            };
            let error;
            try {
                await program.validate({ async: true });
            }
            catch (e) {
                error = e;
            }
            (0, chai_config_spec_1.expect)(error === null || error === void 0 ? void 0 : error.message).to.eql('Crash for test');
        });
        it('includes files added during beforeProgramValidate in validation', () => {
            program.setFile('source/a.brs', `
                sub a()
                    b()
                end sub
            `);
            program.plugins.add({
                name: 'add file in beforeProgramValidate',
                beforeProgramValidate: () => {
                    program.setFile('source/b.brs', `
                        sub b()
                        end sub
                    `);
                }
            });
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('hasFile', () => {
        it('recognizes when it has a file loaded', () => {
            (0, chai_config_spec_1.expect)(program.hasFile('file1.brs')).to.be.false;
            program.setFile('file1.brs', `'comment`);
            (0, chai_config_spec_1.expect)(program.hasFile('file1.brs')).to.be.true;
        });
    });
    describe('getPaths', () => {
        function getPaths(...args) {
            return program.getPaths(...args);
        }
        it('works for dest', () => {
            (0, chai_config_spec_1.expect)(getPaths('source/main.brs', testHelpers_spec_2.rootDir)).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('works for absolute src', () => {
            (0, chai_config_spec_1.expect)(getPaths(`${testHelpers_spec_2.rootDir}/source\\main.brs`, testHelpers_spec_2.rootDir)).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('works for missing src', () => {
            (0, chai_config_spec_1.expect)(getPaths({ dest: 'source/main.brs' }, testHelpers_spec_2.rootDir)).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('works for missing dest', () => {
            (0, chai_config_spec_1.expect)(getPaths({ src: `${testHelpers_spec_2.rootDir}/source/main.brs` }, testHelpers_spec_2.rootDir)).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('works for pkg string', () => {
            (0, chai_config_spec_1.expect)(getPaths('pkg:/source/main.brs', testHelpers_spec_2.rootDir)).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('favors pkgPath over destPath', () => {
            (0, chai_config_spec_1.expect)(getPaths({ srcPath: `${testHelpers_spec_2.rootDir}/source/main.brs`, destPath: 'source/DontUse.brs', pkgPath: `pkg:/source/main.brs` })).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
        it('works when given a file', () => {
            (0, chai_config_spec_1.expect)(getPaths({ srcPath: `${testHelpers_spec_2.rootDir}/source/main.brs`, pkgPath: `source/main.brs` })).to.eql({
                srcPath: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                pkgPath: (0, util_1.standardizePath) `source/main.brs`
            });
        });
    });
    describe('setFile', () => {
        it('links xml scopes based on xml parent-child relationships', () => {
            program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                </component>
            `);
            //create child component
            program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                </component>
            `);
            (0, chai_config_spec_1.expect)(program.getScopeByName('components/ChildScene.xml').getParentScope().name).to.equal((0, util_1.standardizePath) `components/ParentScene.xml`);
            //change the parent's name.
            program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="NotParentScene" extends="Scene">
                </component>
            `);
            //The child scope should no longer have the link to the parent scope, and should instead point back to global
            (0, chai_config_spec_1.expect)(program.getScopeByName('components/ChildScene.xml').getParentScope().name).to.equal('global');
        });
        it('creates a new scope for every added component xml', () => {
            //we have global callables, so get that initial number
            program.setFile('components/component1.xml', '');
            (0, chai_config_spec_1.expect)(program.getScopeByName(`components/component1.xml`)).to.exist;
            program.setFile('components/component1.xml', '');
            program.setFile('components/component2.xml', '');
            (0, chai_config_spec_1.expect)(program.getScopeByName(`components/component1.xml`)).to.exist;
            (0, chai_config_spec_1.expect)(program.getScopeByName(`components/component2.xml`)).to.exist;
        });
        it('includes referenced files in xml scopes', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component1.brs" />
                </component>
            `);
            program.setFile('components/component1.brs', '');
            let scope = program.getScopeByName(`components/component1.xml`);
            (0, chai_config_spec_1.expect)(scope.getFile('components/component1.xml').pkgPath).to.equal((0, util_1.standardizePath) `components/component1.xml`);
            (0, chai_config_spec_1.expect)(scope.getFile('components/component1.brs').pkgPath).to.equal((0, util_1.standardizePath) `components/component1.brs`);
        });
        it('adds xml file to files map', () => {
            program.setFile('components/component1.xml', '');
            (0, chai_config_spec_1.expect)(program.getFile('components/component1.xml')).to.exist;
        });
        it('detects missing script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component1.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.referencedFileDoesNotExist()), { range: vscode_languageserver_1.Range.create(2, 42, 2, 72) })]);
        });
        it('accepts libpkg .brs script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="libpkg:/components/component1.brs" />
                </component>
            `);
            program.setFile('components/component1.brs', '');
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('accepts libpkg .bs script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="libpkg:/components/component1.bs" />
                </component>
            `);
            program.setFile('components/component1.bs', '');
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('does not set function not found diagnostic for function in libpkg referenced script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="libpkg:/components/component1.brs" />
                    <interface>
                        <function name="isFound"/>
                    </interface>
                </component>
            `);
            program.setFile('components/component1.brs', `
                function isFound()
                end function`);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('does not set function not found diagnostic for function in libpkg referenced .bs script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="libpkg:/components/component1.bs" />
                    <interface>
                        <function name="isFound"/>
                    </interface>
                </component>
            `);
            program.setFile('components/component1.bs', `
                function isFound()
                end function`);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('sets function not found diagnostic for missing function in libpkg referenced script reference', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="libpkg:/components/component1.brs" />
                    <interface>
                        <function name="isNotFound"/>
                    </interface>
                </component>
            `);
            program.setFile('components/component1.brs', `
                function isFound()
                end function`);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.xmlFunctionNotFound('isNotFound')
            ]);
        });
        it('adds warning instead of error on mismatched upper/lower case script import', () => {
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="component1.brs" />
                </component>
            `);
            program.setFile('components/COMPONENT1.brs', '');
            //validate
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.scriptImportCaseMismatch((0, util_1.standardizePath) `components\\COMPONENT1.brs`)
            ]);
        });
    });
    describe('reloadFile', () => {
        it('picks up new files in a scope when an xml file is loaded', () => {
            program.options.ignoreErrorCodes.push(1013);
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component1.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.referencedFileDoesNotExist()
            ]);
            //add the file, the error should go away
            program.setFile('components/component1.brs', '');
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            //add the xml file back in, but change the component brs file name. Should have an error again
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component2.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.referencedFileDoesNotExist()
            ]);
        });
        it('handles when the brs file is added before the component', () => {
            let brsPath = (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/component1.brs`;
            program.setFile('components/component1.brs', '');
            let xmlFile = program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component1.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath).getFile(brsPath)).to.exist;
        });
        it('reloads referenced fles when xml file changes', () => {
            program.options.ignoreErrorCodes.push(1013);
            program.setFile('components/component1.brs', '');
            let xmlFile = program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">

                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath).getFile('components/component1.brs')).not.to.exist;
            //reload the xml file contents, adding a new script reference.
            xmlFile = program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/component1.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath).getFile('components/component1.brs')).to.exist;
        });
    });
    describe('getCodeActions', () => {
        it('does not fail when file is missing from program', () => {
            (0, assert_1.doesNotThrow)(() => {
                program.getCodeActions('not/real/file', util_1.util.createRange(1, 2, 3, 4));
            });
        });
    });
    describe('getCompletions', () => {
        it('includes `for each` variable', () => {
            program.setFile('source/main.brs', `
                sub main()
                    items = [1, 2, 3]
                    for each thing in items
                        t =
                    end for
                    end for
                end sub
            `);
            program.validate();
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(4, 28)).map(x => x.label);
            (0, chai_config_spec_1.expect)(completions).to.include('thing');
        });
        it('finds enum member after dot', () => {
            program.setFile('source/main.bs', `
                sub test()
                    thing = alpha.Direction.
                end sub
                namespace alpha
                    enum Direction
                        up
                    end enum
                end namespace
            `);
            program.validate();
            const completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 44));
            (0, chai_config_spec_1.expect)(completions.map(x => ({ kind: x.kind, label: x.label }))).to.eql([{
                    label: 'up',
                    kind: vscode_languageserver_1.CompletionItemKind.EnumMember
                }]);
        });
        it('finds enum member after dot in if statement', () => {
            program.setFile('source/main.bs', `
                sub test()
                    if alpha.beta. then
                    end if
                end sub
                namespace alpha.beta
                    const isEnabled = true
                end namespace
            `);
            program.validate();
            const completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 34));
            (0, chai_config_spec_1.expect)(completions.map(x => ({ kind: x.kind, label: x.label }))).to.eql([{
                    label: 'isEnabled',
                    kind: vscode_languageserver_1.CompletionItemKind.Constant
                }]);
        });
        it('includes `for` variable', () => {
            program.setFile('source/main.brs', `
                sub main()
                    for i = 0 to 10
                        t =
                    end for
                end sub
            `);
            program.validate();
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(3, 28)).map(x => x.label);
            (0, chai_config_spec_1.expect)(completions).to.include('i');
        });
        it('should include first-level namespace names for brighterscript files', () => {
            program.setFile('source/main.bs', `
                namespace NameA.NameB.NameC
                    sub DoSomething()
                    end sub
                end namespace
                sub main()
                    print
                end sub
            `);
            (0, testHelpers_spec_1.expectCompletionsIncludes)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(6, 25)), [{
                    label: 'NameA',
                    kind: vscode_languageserver_1.CompletionItemKind.Module
                }]);
            (0, testHelpers_spec_1.expectCompletionsExcludes)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(6, 25)), [{
                    label: 'NameB',
                    kind: vscode_languageserver_1.CompletionItemKind.Module
                }, {
                    label: 'NameA.NameB',
                    kind: vscode_languageserver_1.CompletionItemKind.Module
                }, {
                    label: 'NameA.NameB.NameC',
                    kind: vscode_languageserver_1.CompletionItemKind.Module
                }, {
                    label: 'NameA.NameB.NameC.DoSomething',
                    kind: vscode_languageserver_1.CompletionItemKind.Module
                }]);
        });
        it('resolves completions for namespaces with next namespace part for brighterscript file', () => {
            program.setFile('source/main.bs', `
                namespace NameA.NameB.NameC
                    sub DoSomething()
                    end sub
                end namespace
                sub main()
                    NameA.
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(6, 26)).map(x => x.label);
            (0, chai_config_spec_1.expect)(completions).to.include('NameB');
            (0, chai_config_spec_1.expect)(completions).not.to.include('NameA');
            (0, chai_config_spec_1.expect)(completions).not.to.include('NameA.NameB');
            (0, chai_config_spec_1.expect)(completions).not.to.include('NameA.NameB.NameC');
            (0, chai_config_spec_1.expect)(completions).not.to.include('NameA.NameB.NameC.DoSomething');
        });
        it('finds namespace members for brighterscript file', () => {
            program.setFile('source/main.bs', `
                sub main()
                    NameA.
                    NameA.NameB.
                    NameA.NameB.NameC.
                end sub
                namespace NameA
                    sub alertA()
                    end sub
                end namespace
                namespace NameA
                    sub info()
                    end sub
                end namespace
                namespace NameA.NameB
                    sub alertB()
                    end sub
                end namespace
                namespace NameA.NameB.NameC
                    sub alertC()
                    end sub
                end namespace
            `);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 26)).map(x => x.label).sort()).to.eql(['NameB', 'alertA', 'info']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(3, 32)).map(x => x.label).sort()).to.eql(['NameC', 'alertB']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(4, 38)).map(x => x.label).sort()).to.eql(['alertC']);
        });
        it('finds namespace members for classes', () => {
            program.setFile('source/main.bs', `
                sub main()
                    NameA.
                    NameA.NameB.
                    NameA.NameB.NameC.
                end sub
                namespace NameA
                    sub alertA()
                    end sub
                end namespace
                namespace NameA
                    sub info()
                    end sub
                    class MyClassA
                    end class
                end namespace
                namespace NameA.NameB
                    sub alertB()
                    end sub
                    class MyClassB
                    end class
                end namespace
                namespace NameA.NameB.NameC
                    sub alertC()
                    end sub
                end namespace
            `);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 26)).map(x => x.label).sort()).to.eql(['MyClassA', 'NameB', 'alertA', 'info']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(3, 32)).map(x => x.label).sort()).to.eql(['MyClassB', 'NameC', 'alertB']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(4, 38)).map(x => x.label).sort()).to.eql(['alertC']);
        });
        it('finds only namespaces that have classes, when new keyword is used', () => {
            program.setFile('source/main.bs', `
                sub main()
                    a = new NameA.
                    b = new NameA.NameB.
                    c = new NameA.NameB.NameC.
                end sub
                namespace NameA
                    sub alertA()
                    end sub
                end namespace
                namespace NameA
                    sub info()
                    end sub
                    class MyClassA
                    end class
                end namespace
                namespace NameA.NoClassA
                end namespace
                namespace NameA.NoClassB
                end namespace
                namespace NameA.NameB
                    sub alertB()
                    end sub
                    class MyClassB
                    end class
                end namespace
                namespace NameA.NameB.NoClass
                end namespace
                namespace NameA.NameB.NameC
                    sub alertC()
                    end sub
                end namespace
            `);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 34)).map(x => x.label).sort()).to.eql(['MyClassA', 'NameB']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(3, 40)).map(x => x.label).sort()).to.eql(['MyClassB']);
            (0, chai_config_spec_1.expect)(program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(4, 46)).map(x => x.label).sort()).to.be.empty;
        });
        //Bron.. pain to get this working.. do we realy need this? seems moot with ropm..
        it.skip('should include translated namespace function names for brightscript files', () => {
            program.setFile('source/main.bs', `
                namespace NameA.NameB.NameC
                    sub DoSomething()
                    end sub
                end namespace
            `);
            program.setFile('source/lib.brs', `
                sub test()

                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/lib.brs`, vscode_languageserver_1.Position.create(2, 23));
            (0, chai_config_spec_1.expect)(completions.map(x => x.label)).to.include('NameA_NameB_NameC_DoSomething');
        });
        it('inlcudes global completions for file with no scope', () => {
            program.setFile('main.brs', `
                function Main()
                    age = 1
                end function
            `);
            let completions = program.getCompletions('main.brs', vscode_languageserver_1.Position.create(2, 10));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label.toLowerCase() === 'abs')).to.be.lengthOf(1);
        });
        it('filters out text results for top-level function statements', () => {
            program.setFile('source/main.brs', `
                function Main()
                    age = 1
                end function
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 10));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'Main')).to.be.lengthOf(1);
        });
        it('does not filter text results for object properties used in conditional statements', () => {
            program.setFile('source/main.brs', `
                sub Main()
                    p.
                end sub
                sub SayHello()
                    person = {}
                    if person.isAlive then
                        print "Hello"
                    end if
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 22));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'isAlive')).to.be.lengthOf(1);
        });
        it('does not filter text results for object properties used in assignments', () => {
            program.setFile('source/main.brs', `
                sub Main()
                    p.
                end sub
                sub SayHello()
                   person = {}
                   localVar = person.name
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 22));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'name')).to.be.lengthOf(1);
        });
        it('does not filter text results for object properties', () => {
            program.setFile('source/main.brs', `
                sub Main()
                    p.
                end sub
                sub SayHello()
                   person = {}
                   person.name = "bob"
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 22));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'name')).to.be.lengthOf(1);
        });
        it('filters out text results for local vars used in conditional statements', () => {
            program.setFile('source/main.brs', `
                sub Main()

                end sub
                sub SayHello()
                    isTrue = true
                    if isTrue then
                        print "is true"
                    end if
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 10));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'isTrue')).to.be.lengthOf(0);
        });
        it('filters out text results for local variable assignments', () => {
            program.setFile('source/main.brs', `
                sub Main()

                end sub
                sub SayHello()
                    message = "Hello"
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 10));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'message')).to.be.lengthOf(0);
        });
        it('filters out text results for local variables used in assignments', () => {
            program.setFile('source/main.brs', `
                sub Main()

                end sub
                sub SayHello()
                    message = "Hello"
                    otherVar = message
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 10));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.label === 'message')).to.be.lengthOf(0);
        });
        it('does not suggest local variables when initiated to the right of a period', () => {
            program.setFile('source/main.brs', `
                function Main()
                    helloMessage = "jack"
                    person.hello
                end function
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(3, 32));
            (0, chai_config_spec_1.expect)(completions.filter(x => x.kind === vscode_languageserver_1.CompletionItemKind.Variable).map(x => x.label)).not.to.contain('helloMessage');
        });
        it('finds all file paths when initiated on xml uri', () => {
            let xmlPath = (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/component1.xml`;
            program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="HeroScene" extends="Scene">
                    <script type="text/brightscript" uri="" />
                </component>
            `);
            program.setFile('components/component1.brs', '');
            let completions = program.getCompletions(xmlPath, vscode_languageserver_1.Position.create(2, 42));
            (0, chai_config_spec_1.expect)(completions[0]).to.include({
                kind: vscode_languageserver_1.CompletionItemKind.File,
                label: 'component1.brs'
            });
            (0, chai_config_spec_1.expect)(completions[1]).to.include({
                kind: vscode_languageserver_1.CompletionItemKind.File,
                label: 'pkg:/components/component1.brs'
            });
            //it should NOT include the global methods
            (0, chai_config_spec_1.expect)(completions).to.be.lengthOf(2);
        });
        it('get all functions and properties in scope when doing any dotted get on non m ', () => {
            program.setFile('source/main.bs', `
                sub main()
                    thing.anonPropA = "foo"
                    thing.anonPropB = "bar"
                    thing.person
                end sub
                class MyClassA
                    personName = "rafa"
                    personAName = "rafaA"
                    function personAMethodA()
                    end function
                    function personAMethodB()
                    end function
                end class
                namespace NameA
                    sub alertA()
                    end sub
                end namespace
                namespace NameA.NameB
                    sub alertB()
                    end sub
                    class MyClassB
                        personName = "roger"
                        personBName = "rogerB"
                        function personAMethodC()
                        end function
                        function personBMethodA()
                        end function
                        function personBMethodB()
                        end function
                    end class
                end namespace
                namespace NameA.NameB.NameC
                    sub alertC()
                    end sub
                end namespace
            `);
            //note - we let the vscode extension do the filtering, so we still return everything; otherwise it exhibits strange behaviour in the IDE
            (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(4, 32))).map(x => x.label).sort()).to.eql(['anonPropA', 'anonPropB', 'person', 'personAMethodA', 'personAMethodB', 'personAMethodC', 'personAName', 'personBMethodA', 'personBMethodB', 'personBName', 'personName']);
        });
        it('get all functions and properties relevant for m ', () => {
            program.setFile('source/main.bs', `
                class MyClassA
                    function new()
                        m.
                    end function
                    personName = "rafa"
                    personAName = "rafaA"
                    function personAMethodA()
                    end function
                    function personAMethodB()
                    end function
                end class
                class MyClassB
                    personName = "roger"
                    personBName = "rogerB"
                    function personAMethodC()
                    end function
                    function personBMethodA()
                    end function
                    function personBMethodB()
                    end function
                end class
                class MyClassC extends MyClassA
                    function new()
                        m.
                    end function
                    personCName = "rogerC"
                    function personCMethodC()
                    end function
                    function personCMethodA()
                    end function
                    function personCMethodB()
                    end function
                end class
                sub alertC()
                end sub
            `);
            (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(3, 26))).map(x => x.label).sort()).to.eql(['personAMethodA', 'personAMethodB', 'personAName', 'personName']);
            (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(24, 26))).map(x => x.label).sort()).to.eql(['personAMethodA', 'personAMethodB', 'personAName', 'personCMethodA', 'personCMethodB', 'personCMethodC', 'personCName', 'personName']);
        });
    });
    it('include non-namespaced classes in the list of general output', () => {
        program.setFile('source/main.bs', `
                function regularFunc()
                    MyClass
                end function
                sub alertC()
                end sub
                class MyClassA
                end class
                class MyClassB
                end class
                class MyClassC extends MyClassA
                end class
            `);
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(3, 26))).map(x => x.label).sort()).to.include.members(['MyClassA', 'MyClassB', 'MyClassC']);
    });
    it('only include classes when using new keyword', () => {
        program.setFile('source/main.bs', `
                class MyClassA
                end class
                class MyClassB
                end class
                class MyClassC extends MyClassA
                end class
                function regularFunc()
                    new MyClass
                end function
                sub alertC()
                end sub
            `);
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(8, 29))).map(x => x.label).sort()).to.eql(['MyClassA', 'MyClassB', 'MyClassC']);
    });
    it('gets completions when using callfunc inovation', () => {
        program.setFile('source/main.bs', `
            function main()
                myNode@.sayHello(arg1)
            end function
        `);
        program.setFile('components/MyNode.bs', `
            function sayHello(text, text2)
            end function
        `);
        program.setFile('components/MyNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component1" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/MyNode.bs" />
                <interface>
                    <function name="sayHello"/>
                </interface>
            </component>`);
        program.validate();
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 30))).map(x => x.label).sort()).to.eql(['sayHello']);
    });
    it('gets completions for callfunc invocation with multiple nodes', () => {
        program.setFile('source/main.bs', `
            function main()
                myNode@.sayHello(arg1)
            end function
        `);
        program.setFile('components/MyNode.bs', `
            function sayHello(text, text2)
            end function
            function sayHello2(text, text2)
            end function
        `);
        program.setFile('components/MyNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component1" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/MyNode.bs" />
                <interface>
                    <function name="sayHello"/>
                    <function name="sayHello2"/>
                </interface>
            </component>`);
        program.setFile('components/MyNode2.bs', `
            function sayHello3(text, text2)
            end function
            function sayHello4(text, text2)
            end function
        `);
        program.setFile('components/MyNode2.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component2" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/MyNode2.bs" />
                <interface>
                    <function name="sayHello3"/>
                    <function name="sayHello4"/>
                </interface>
            </component>`);
        program.validate();
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 30))).map(x => x.label).sort()).to.eql(['sayHello', 'sayHello2', 'sayHello3', 'sayHello4']);
    });
    it('gets completions for callfunc invocation with multiple nodes and validates single code completion results', () => {
        program.setFile('source/main.bs', `
            function main()
                ParentNode@.sayHello(arg1)
            end function
        `);
        program.setFile('components/ParentNode.bs', `
            function sayHello(text, text2)
            end function
        `);
        program.setFile('components/ParentNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="ParentNode" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/ParentNode.bs" />
                <interface>
                    <function name="sayHello"/>
                </interface>
            </component>`);
        program.setFile('components/ChildNode.bs', `
            function sayHello(text, text2)
            end function
        `);
        program.setFile('components/ChildNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildNode" extends="ParentNode">
                <script type="text/brightscript" uri="pkg:/components/ChildNode.bs" />
            </component>`);
        program.validate();
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 30))).map(x => x.label).sort()).to.eql(['sayHello']);
    });
    it('gets completions for extended nodes with callfunc invocation - ensure overridden methods included', () => {
        program.setFile('source/main.bs', `
            function main()
                myNode@.sayHello(arg1)
            end function
        `);
        program.setFile('components/MyNode.bs', `
            function sayHello(text, text2)
            end function
            function sayHello2(text, text2)
            end function
        `);
        program.setFile('components/MyNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component1" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/MyNode.bs" />
                <interface>
                    <function name="sayHello"/>
                    <function name="sayHello2"/>
                </interface>
            </component>`);
        program.setFile('components/MyNode2.bs', `
            function sayHello3(text, text2)
            end function
            function sayHello2(text, text2)
            end function
            function sayHello4(text, text2)
            end function
        `);
        program.setFile('components/MyNode2.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component2" extends="Component1">
                <script type="text/brightscript" uri="pkg:/components/MyNode2.bs" />
                <interface>
                    <function name="sayHello3"/>
                    <function name="sayHello4"/>
                </interface>
            </component>`);
        program.validate();
        (0, chai_config_spec_1.expect)((program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 30))).map(x => x.label).sort()).to.eql(['sayHello', 'sayHello2', 'sayHello3', 'sayHello4']);
    });
    describe('xml inheritance', () => {
        it('handles parent-child attach and detach', () => {
            //create parent component
            let parentFile = program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                </component>
            `);
            //create child component
            let childFile = program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                </component>
            `);
            //the child should have been attached to the parent
            (0, chai_config_spec_1.expect)(childFile.parentComponent).to.equal(parentFile);
            //change the name of the parent
            parentFile = program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="NotParentScene" extends="Scene">
                </component>
            `);
            //the child should no longer have a parent
            (0, chai_config_spec_1.expect)(childFile.parentComponent).not.to.exist;
        });
        it('provides child components with parent functions', () => {
            //create parent component
            program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                </component>
            `);
            //create child component
            program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="ChildScene.brs" />
                </component>
            `);
            program.setFile('components/ChildScene.brs', `
                sub Init()
                    DoParentThing()
                end sub
            `);
            program.validate();
            //there should be an error when calling DoParentThing, since it doesn't exist on child or parent
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction('DoParentThing')
            ]);
            //add the script into the parent
            program.setFile('components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="Scene">
                    <script type="text/brightscript" uri="ParentScene.brs" />
                </component>
            `);
            program.setFile('components/ParentScene.brs', `
                sub DoParentThing()

                end sub
            `);
            program.validate();
            //the error should be gone because the child now has access to the parent script
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('xml scope', () => {
        it('does not fail on base components with many children', () => {
            program.setFile('source/lib.brs', `
                sub DoSomething()
                end sub
            `);
            //add a brs file with invalid syntax
            program.setFile('components/base.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="BaseScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                </component>
            `);
            let childCount = 20;
            //add many children, we should never encounter an error
            for (let i = 0; i < childCount; i++) {
                program.setFile(`components/child${i}.xml`, (0, testHelpers_spec_1.trim) `
                    <?xml version="1.0" encoding="utf-8" ?>
                    <component name="Child${i}" extends="BaseScene">
                        <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                    </component>
                `);
            }
            program.validate();
            //the children shouldn't have diagnostics about shadowing their parent lib.brs file.
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program.getDiagnostics().filter((x) => x.code === DiagnosticMessages_1.DiagnosticMessages.overridesAncestorFunction('', '', '', '').code));
            //the children all include a redundant import of lib.brs file which is imported by the parent.
            (0, chai_config_spec_1.expect)(program.getDiagnostics().filter((x) => x.code === DiagnosticMessages_1.DiagnosticMessages.unnecessaryScriptImportInChildFromParent('').code)).to.be.lengthOf(childCount);
        });
        it('detects script import changes', () => {
            //create the xml file without script imports
            let xmlFile = program.setFile('components/component.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="MyScene" extends="Scene">
                </component>
            `);
            //the component scope should only have the xml file
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath).getOwnFiles().length).to.equal(1);
            //create the lib file
            let libFile = program.setFile('source/lib.brs', `'comment`);
            //change the xml file to have a script import
            xmlFile = program.setFile('components/component.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="MyScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                </component>
            `);
            let scope = program.getScopeByName(xmlFile.pkgPath);
            //the component scope should have the xml file AND the lib file
            (0, chai_config_spec_1.expect)(scope.getOwnFiles().length).to.equal(2);
            (0, chai_config_spec_1.expect)(scope.getFile(xmlFile.srcPath)).to.exist;
            (0, chai_config_spec_1.expect)(scope.getFile(libFile.srcPath)).to.exist;
            //reload the xml file again, removing the script import.
            xmlFile = program.setFile('components/component.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="MyScene" extends="Scene">
                </component>
            `);
            //the scope should again only have the xml file loaded
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath).getOwnFiles().length).to.equal(1);
            (0, chai_config_spec_1.expect)(program.getScopeByName(xmlFile.pkgPath)).to.exist;
        });
    });
    describe('getFileByPkgPath', () => {
        it('finds file in source folder', () => {
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main.brs`)).not.to.exist;
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main2.brs`)).not.to.exist;
            program.setFile('source/main2.brs', '');
            program.setFile('source/main.brs', '');
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main.brs`)).to.exist;
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main2.brs`)).to.exist;
        });
    });
    describe('removeFiles', () => {
        it('removes files by absolute paths', () => {
            program.setFile('source/main.brs', '');
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main.brs`)).to.exist;
            program.removeFiles([`${testHelpers_spec_2.rootDir}/source/main.brs`]);
            (0, chai_config_spec_1.expect)(program.getFileByPkgPath((0, util_1.standardizePath) `source/main.brs`)).not.to.exist;
        });
    });
    describe('getDiagnostics', () => {
        it('includes diagnostics from files not included in any scope', () => {
            program.setFile('components/a/b/c/main.brs', `
                sub A()
                    "this string is not terminated
                end sub
            `);
            //the file should be included in the program
            (0, chai_config_spec_1.expect)(program.getFile('components/a/b/c/main.brs')).to.exist;
            let diagnostics = program.getDiagnostics();
            (0, testHelpers_spec_1.expectHasDiagnostics)(diagnostics);
            let parseError = diagnostics.filter(x => x.message === 'Unterminated string at end of line')[0];
            (0, chai_config_spec_1.expect)(parseError).to.exist;
        });
        it('it excludes specified error codes', () => {
            //declare file with two different syntax errors
            program.setFile('source/main.brs', `
                sub A()
                    'call with wrong param count
                    B(1,2,3)

                    'call unknown function
                    C()
                end sub

                sub B(name as string)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectHasDiagnostics)(program, 2);
            program.options.diagnosticFilters = [
                DiagnosticMessages_1.DiagnosticMessages.mismatchArgumentCount(0, 0).code
            ];
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction('C')
            ]);
        });
    });
    describe('getCompletions', () => {
        it('returns all functions in scope', () => {
            program.setFile('source/main.brs', `
                sub Main()

                end sub

                sub ActionA()
                end sub
            `);
            program.setFile('source/lib.brs', `
                sub ActionB()
                end sub
            `);
            program.validate();
            let completions = program
                //get completions
                .getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, util_1.util.createPosition(2, 10))
                //only keep the label property for this test
                .map(x => pick(x, 'label'));
            (0, chai_config_spec_1.expect)(completions).to.deep.include({ label: 'Main' });
            (0, chai_config_spec_1.expect)(completions).to.deep.include({ label: 'ActionA' });
            (0, chai_config_spec_1.expect)(completions).to.deep.include({ label: 'ActionB' });
        });
        it('returns all variables in scope', () => {
            program.setFile('source/main.brs', `
                sub Main()
                    name = "bob"
                    age = 20
                    shoeSize = 12.5
                end sub
                sub ActionA()
                end sub
            `);
            program.setFile('source/lib.brs', `
                sub ActionB()
                end sub
            `);
            program.validate();
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, util_1.util.createPosition(2, 10));
            let labels = completions.map(x => pick(x, 'label'));
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'Main' });
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'ActionA' });
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'ActionB' });
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'name' });
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'age' });
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'shoeSize' });
        });
        it('returns empty set when out of range', () => {
            const position = util_1.util.createPosition(99, 99);
            program.setFile('source/main.brs', '');
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, position);
            //get the name of all global completions
            const globalCompletions = program.globalScope.getAllFiles().flatMap(x => x.getCompletions(position)).map(x => x.label);
            //filter out completions from global scope
            completions = completions.filter(x => !globalCompletions.includes(x.label));
            (0, chai_config_spec_1.expect)(completions).to.be.empty;
        });
        it('finds parameters', () => {
            program.setFile('source/main.brs', `
                sub Main(count = 1)
                    firstName = "bob"
                    age = 21
                    shoeSize = 10
                end sub
            `);
            let completions = program.getCompletions(`${testHelpers_spec_2.rootDir}/source/main.brs`, vscode_languageserver_1.Position.create(2, 10));
            let labels = completions.map(x => pick(x, 'label'));
            (0, chai_config_spec_1.expect)(labels).to.deep.include({ label: 'count' });
        });
    });
    it('does not create map by default', async () => {
        fsExtra.ensureDirSync(program.options.stagingDir);
        program.setFile('source/main.brs', `
            sub main()
            end sub
        `);
        program.validate();
        await program.transpile([], program.options.stagingDir);
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs`)).is.true;
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs.map`)).is.false;
    });
    it('creates sourcemap for brs and xml files', async () => {
        fsExtra.ensureDirSync(program.options.stagingDir);
        program.setFile('source/main.brs', `
            sub main()
            end sub
        `);
        program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="SimpleScene" extends="Scene">
            </component>
        `);
        program.validate();
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs.map`)).is.false;
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/components/comp1.xml.map`)).is.false;
        let filePaths = [{
                src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                dest: (0, util_1.standardizePath) `source/main.brs`
            }, {
                src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
                dest: (0, util_1.standardizePath) `components/comp1.xml`
            }];
        program.options.sourceMap = true;
        await program.transpile(filePaths, program.options.stagingDir);
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs.map`)).is.true;
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/components/comp1.xml.map`)).is.true;
    });
    it('copies the bslib.brs file', async () => {
        fsExtra.ensureDirSync(program.options.stagingDir);
        program.validate();
        await program.transpile([], program.options.stagingDir);
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/bslib.brs`)).is.true;
    });
    it('copies the bslib.brs file to optionally specified directory', async () => {
        fsExtra.ensureDirSync(program.options.stagingDir);
        program.options.bslibDestinationDir = 'source/opt';
        program.validate();
        await program.transpile([], program.options.stagingDir);
        (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/opt/bslib.brs`)).is.true;
    });
    describe('getTranspiledFileContents', () => {
        it('fires plugin events', async () => {
            const file = program.setFile('source/main.brs', (0, testHelpers_spec_1.trim) `
                sub main()
                    print "hello world"
                end sub
            `);
            const plugin = program.plugins.add({
                name: 'TestPlugin',
                beforeFileTranspile: (event) => {
                    const stmt = event.file.ast.statements[0].func.body.statements[0];
                    event.editor.setProperty(stmt.expressions[0].token, 'text', '"hello there"');
                },
                afterFileTranspile: sinon.spy()
            });
            (0, chai_config_spec_1.expect)((await program.getTranspiledFileContents(file.srcPath)).code).to.eql((0, testHelpers_spec_1.trim) `
                sub main()
                    print "hello there"
                end sub`);
            (0, chai_config_spec_1.expect)(plugin.afterFileTranspile.callCount).to.be.greaterThan(0);
        });
        it('allows events to modify the file contents', async () => {
            program.options.emitDefinitions = true;
            program.plugins.add({
                name: 'TestPlugin',
                afterFileTranspile: (event) => {
                    event.code = `'code comment\n${event.code}`;
                    event.typedef = `'typedef comment\n${event.typedef}`;
                }
            });
            program.setFile('source/lib.bs', `
                sub log(message)
                    print message
                end sub
            `);
            await program.transpile([], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/lib.brs`).toString().trimEnd()).to.eql((0, testHelpers_spec_1.trim) `
                'code comment
                sub log(message)
                    print message
                end sub`);
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/lib.d.bs`).toString().trimEnd()).to.eql((0, testHelpers_spec_1.trim) `
                'typedef comment
                sub log(message)
                end sub
            `);
        });
    });
    it('beforeProgramTranspile sends entries in alphabetical order', () => {
        program.setFile('source/main.bs', (0, testHelpers_spec_1.trim) `
            sub main()
                print "hello world"
            end sub
        `);
        program.setFile('source/common.bs', (0, testHelpers_spec_1.trim) `
            sub getString()
                return "test"
            end sub
        `);
        //send the files out of order
        const result = program['beforeProgramTranspile']([{
                src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`,
                dest: 'source/main.bs'
            }, {
                src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/common.bs`,
                dest: 'source/common.bs'
            }], program.options.stagingDir);
        //entries should now be in alphabetic order
        (0, chai_config_spec_1.expect)(result.entries.map(x => x.outputPath)).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/common.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs`
        ]);
    });
    describe('transpile', () => {
        it('detects and transpiles files added between beforeProgramTranspile and afterProgramTranspile', async () => {
            program.setFile('source/main.bs', (0, testHelpers_spec_1.trim) `
                sub main()
                    print "hello world"
                end sub
            `);
            program.plugins.add({
                name: 'TestPlugin',
                beforeFileTranspile: (event) => {
                    if ((0, reflection_1.isBrsFile)(event.file)) {
                        //add lib1
                        if (event.outputPath.endsWith('main.brs')) {
                            event.program.setFile('source/lib1.bs', `
                                sub lib1()
                                end sub
                            `);
                        }
                        //add lib2 (this should happen during the next cycle of "catch missing files" cycle
                        if (event.outputPath.endsWith('main.brs')) {
                            //add another file
                            event.program.setFile('source/lib2.bs', `
                                sub lib2()
                                end sub
                            `);
                        }
                    }
                }
            });
            await program.transpile([], testHelpers_spec_2.stagingDir);
            //our new files should exist
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/lib1.brs`).toString()).to.eql((0, testHelpers_spec_1.trim) `
                sub lib1()
                end sub
            `);
            //our changes should be there
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/lib2.brs`).toString()).to.eql((0, testHelpers_spec_1.trim) `
                sub lib2()
                end sub
            `);
        });
        it('sets needsTranspiled=true when there is at least one edit', async () => {
            program.setFile('source/main.brs', (0, testHelpers_spec_1.trim) `
                sub main()
                    print "hello world"
                end sub
            `);
            program.plugins.add({
                name: 'TestPlugin',
                beforeFileTranspile: (event) => {
                    const stmt = event.file.ast.statements[0].func.body.statements[0];
                    event.editor.setProperty(stmt.expressions[0].token, 'text', '"hello there"');
                }
            });
            await program.transpile([], testHelpers_spec_2.stagingDir);
            //our changes should be there
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/main.brs`).toString()).to.eql((0, testHelpers_spec_1.trim) `
                sub main()
                    print "hello there"
                end sub`);
        });
        it('handles AstEditor flow properly', async () => {
            program.setFile('source/main.bs', `
                sub main()
                    print "hello world"
                end sub
            `);
            let literalExpression;
            //replace all strings with "goodbye world"
            program.plugins.add({
                name: 'TestPlugin',
                beforeFileTranspile: (event) => {
                    if ((0, reflection_1.isBrsFile)(event.file)) {
                        event.file.ast.walk((0, visitors_1.createVisitor)({
                            LiteralExpression: (literal) => {
                                literalExpression = literal;
                                event.editor.setProperty(literal.token, 'text', '"goodbye world"');
                            }
                        }), {
                            walkMode: visitors_1.WalkMode.visitExpressionsRecursive
                        });
                    }
                }
            });
            //transpile the file
            await program.transpile([], testHelpers_spec_2.stagingDir);
            //our changes should be there
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/main.brs`).toString()).to.eql((0, testHelpers_spec_1.trim) `
                sub main()
                    print "goodbye world"
                end sub`);
            //our literalExpression should have been restored to its original value
            (0, chai_config_spec_1.expect)(literalExpression.token.text).to.eql('"hello world"');
        });
        it('handles AstEditor for beforeProgramTranspile', async () => {
            const file = program.setFile('source/main.bs', `
                sub main()
                    print "hello world"
                end sub
            `);
            let literalExpression;
            //replace all strings with "goodbye world"
            program.plugins.add({
                name: 'TestPlugin',
                beforeProgramTranspile: (program, entries, editor) => {
                    file.ast.walk((0, visitors_1.createVisitor)({
                        LiteralExpression: (literal) => {
                            literalExpression = literal;
                            editor.setProperty(literal.token, 'text', '"goodbye world"');
                        }
                    }), {
                        walkMode: visitors_1.WalkMode.visitExpressionsRecursive
                    });
                }
            });
            //transpile the file
            await program.transpile([], testHelpers_spec_2.stagingDir);
            //our changes should be there
            (0, chai_config_spec_1.expect)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/source/main.brs`).toString()).to.eql((0, testHelpers_spec_1.trim) `
                sub main()
                    print "goodbye world"
                end sub`);
            //our literalExpression should have been restored to its original value
            (0, chai_config_spec_1.expect)(literalExpression.token.text).to.eql('"hello world"');
        });
        it('copies bslib.brs when no ropm version was found', async () => {
            await program.transpile([], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync(`${testHelpers_spec_2.stagingDir}/source/bslib.brs`)).to.be.true;
        });
        it('does not copy bslib.brs when found in roku_modules', async () => {
            program.setFile('source/roku_modules/bslib/bslib.brs', '');
            await program.transpile([], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync(`${testHelpers_spec_2.stagingDir}/source/bslib.brs`)).to.be.false;
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync(`${testHelpers_spec_2.stagingDir}/source/roku_modules/bslib/bslib.brs`)).to.be.true;
        });
        it('transpiles in-memory-only files', async () => {
            program.setFile('source/logger.bs', (0, testHelpers_spec_1.trim) `
                sub logInfo()
                    print SOURCE_LINE_NUM
                end sub
            `);
            await program.transpile([], program.options.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/logger.brs`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                sub logInfo()
                    print 2
                end sub
            `);
        });
        it('copies in-memory-only .brs files to stagingDir', async () => {
            program.setFile('source/logger.brs', (0, testHelpers_spec_1.trim) `
                sub logInfo()
                    print "logInfo"
                end sub
            `);
            await program.transpile([], program.options.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/logger.brs`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                sub logInfo()
                    print "logInfo"
                end sub
            `);
        });
        it('copies in-memory .xml file', async () => {
            program.setFile('components/Component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                </component>
            `);
            await program.transpile([], program.options.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/components/Component1.xml`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `);
        });
        it('uses custom bslib path when specified in .xml file', async () => {
            program.options.bslibDestinationDir = 'source/opt';
            program.setFile('components/Component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                </component>
            `);
            await program.transpile([], program.options.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/components/Component1.xml`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/opt/bslib.brs" />
                </component>
            `);
        });
        it('uses sourceRoot when provided for brs files', async () => {
            let sourceRoot = (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sourceRootFolder`;
            program = new Program_1.Program({
                rootDir: testHelpers_spec_2.rootDir,
                stagingDir: testHelpers_spec_2.stagingDir,
                sourceRoot: sourceRoot,
                sourceMap: true
            });
            program.setFile('source/main.brs', `
                sub main()
                end sub
            `);
            await program.transpile([{
                    src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.brs`,
                    dest: (0, util_1.standardizePath) `source/main.brs`
                }], testHelpers_spec_2.stagingDir);
            let contents = fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs.map`).toString();
            let map = JSON.parse(contents);
            (0, chai_config_spec_1.expect)((0, util_1.standardizePath) `${map.sources[0]}`).to.eql((0, util_1.standardizePath) `${sourceRoot}/source/main.brs`);
        });
        it('uses sourceRoot when provided for bs files', async () => {
            let sourceRoot = (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sourceRootFolder`;
            program = new Program_1.Program({
                rootDir: testHelpers_spec_2.rootDir,
                stagingDir: testHelpers_spec_2.stagingDir,
                sourceRoot: sourceRoot,
                sourceMap: true
            });
            program.setFile('source/main.bs', `
                sub main()
                end sub
            `);
            await program.transpile([{
                    src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`,
                    dest: (0, util_1.standardizePath) `source/main.bs`
                }], testHelpers_spec_2.stagingDir);
            let contents = fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs.map`).toString();
            let map = JSON.parse(contents);
            (0, chai_config_spec_1.expect)((0, util_1.standardizePath) `${map.sources[0]}`).to.eql((0, util_1.standardizePath) `${sourceRoot}/source/main.bs`);
        });
        it('does not publish files that are empty', async () => {
            let sourceRoot = (0, util_1.standardizePath) `${testHelpers_spec_2.tempDir}/sourceRootFolder`;
            program = new Program_1.Program({
                rootDir: testHelpers_spec_2.rootDir,
                stagingDir: testHelpers_spec_2.stagingDir,
                sourceRoot: sourceRoot,
                sourceMap: true,
                pruneEmptyCodeFiles: true
            });
            program.setFile('source/types.bs', `
                enum mainstyle
                    dark = "dark"
                    light = "light"
                end enum
            `);
            program.setFile('source/main.bs', `
                import "pkg:/source/types.bs"

                sub main()
                    ? "The night is " + mainstyle.dark + " and full of terror"
                end sub
            `);
            await program.transpile([
                {
                    src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/main.bs`,
                    dest: (0, util_1.standardizePath) `source/main.bs`
                },
                {
                    src: (0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/source/types.bs`,
                    dest: (0, util_1.standardizePath) `source/types.bs`
                }
            ], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/main.brs`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                'import "pkg:/source/types.bs"

                sub main()
                    ? "The night is " + "dark" + " and full of terror"
                end sub
            `);
            (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/types.brs`)).to.be.false;
        });
    });
    describe('typedef', () => {
        describe('emitDefinitions', () => {
            it('generates typedef for .bs files', async () => {
                program.setFile('source/Duck.bs', `
                    class Duck
                    end class
                `);
                program.options.emitDefinitions = true;
                program.validate();
                await program.transpile([], testHelpers_spec_2.stagingDir);
                (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/Duck.brs`)).to.be.true;
                (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/Duck.d.bs`)).to.be.true;
                (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/Duck.d.brs`)).to.be.false;
            });
            it('does not generate typedef for typedef file', async () => {
                program.setFile('source/Duck.d.bs', `
                    class Duck
                    end class
                `);
                program.options.emitDefinitions = true;
                program.validate();
                await program.transpile([], testHelpers_spec_2.stagingDir);
                (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/Duck.d.brs`)).to.be.false;
                (0, chai_config_spec_1.expect)(fsExtra.pathExistsSync((0, util_1.standardizePath) `${testHelpers_spec_2.stagingDir}/source/Duck.brs`)).to.be.false;
            });
        });
        it('ignores bs1018 for d.bs files', () => {
            program.setFile('source/main.d.bs', `
                class Duck
                    sub new(name as string)
                    end sub
                    name as string
                end class

                class BabyDuck extends Duck
                    sub new(name as string, age as integer)
                    end sub
                    age as integer
                end class
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('getSignatureHelp', () => {
        function getSignatureHelp(line, column) {
            return program.getSignatureHelp('source/main.bs', util_1.util.createPosition(line, column));
        }
        function assertSignatureHelp(line, col, text, index) {
            var _a, _b, _c, _d, _e, _f;
            let signatureHelp = getSignatureHelp(line, col);
            (0, chai_config_spec_1.expect)((_b = (_a = signatureHelp === null || signatureHelp === void 0 ? void 0 : signatureHelp[0]) === null || _a === void 0 ? void 0 : _a.signature) === null || _b === void 0 ? void 0 : _b.label, `wrong label for ${line},${col} - got: "${(_d = (_c = signatureHelp === null || signatureHelp === void 0 ? void 0 : signatureHelp[0]) === null || _c === void 0 ? void 0 : _c.signature) === null || _d === void 0 ? void 0 : _d.label}" expected "${text}"`).to.equal(text);
            (0, chai_config_spec_1.expect)((_e = signatureHelp === null || signatureHelp === void 0 ? void 0 : signatureHelp[0]) === null || _e === void 0 ? void 0 : _e.index, `wrong index for ${line},${col} - got ${(_f = signatureHelp === null || signatureHelp === void 0 ? void 0 : signatureHelp[0]) === null || _f === void 0 ? void 0 : _f.index} expected ${index}`).to.equal(index);
        }
        it('does not crash when there is no file', () => {
            var _a;
            let signatureHelp = getSignatureHelp(1, 9);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            (0, chai_config_spec_1.expect)((_a = signatureHelp[0]) === null || _a === void 0 ? void 0 : _a.signature).to.not.exist;
        });
        it('does not crash when there is no expression at location', () => {
            var _a;
            program.validate();
            let signatureHelp = getSignatureHelp(1, 9);
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            (0, chai_config_spec_1.expect)((_a = signatureHelp[0]) === null || _a === void 0 ? void 0 : _a.signature).to.not.exist;
        });
        it('does not crash when parts is undefined', () => {
            program.setFile('source/main.bs', `
                sub main()
                    print m.b["c"].hello?(12345)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            // 123|45
            let signatureHelp = getSignatureHelp(2, 45);
            (0, chai_config_spec_1.expect)(signatureHelp).is.empty;
        });
        describe('gets signature info for regular function call', () => {
            it('does not get help when on method name', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello("name", 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 24; i < 33; i++) {
                    let signatureHelp = getSignatureHelp(2, i);
                    (0, chai_config_spec_1.expect)(signatureHelp).is.empty;
                }
            });
            it('gets help when on first param', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello("name", 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 33; i < 40; i++) {
                    assertSignatureHelp(2, i, 'sub sayHello(name as string, age as integer)', 0);
                }
            });
            it('gets help when on second param', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello("name", 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 41; i < 44; i++) {
                    assertSignatureHelp(2, i, 'sub sayHello(name as string, age as integer)', 1);
                }
            });
        });
        describe('does not crash for unknown function info for regular function call', () => {
            it('gets help when on method name', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        cryHello("name", 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub
                `);
                program.validate();
                let signatureHelp = getSignatureHelp(2, 26);
                (0, chai_config_spec_1.expect)(signatureHelp).to.be.empty;
                signatureHelp = getSignatureHelp(2, 34);
                (0, chai_config_spec_1.expect)(signatureHelp).to.be.empty;
                signatureHelp = getSignatureHelp(2, 43);
                (0, chai_config_spec_1.expect)(signatureHelp).to.be.empty;
            });
        });
        describe('gets signature info for class function call', () => {
            it('gets help when on method name', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        william = new Greeter()
                        william.sayHello("name", 12)
                    end sub
                    class Greeter
                        sub sayHello(name as string, age as integer)
                        end sub
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 42, 'sub sayHello(name as string, age as integer)', 0);
            });
            it('gets help when on first param', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        william = new Greeter()
                        william.sayHello("name", 12)
                    end sub
                    class Greeter
                        sub sayHello(name as string, age as integer)
                        end sub
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 51, 'sub sayHello(name as string, age as integer)', 1);
            });
        });
        describe('gets signature info for class function call on this class', () => {
            it('gets help when on method name', () => {
                program.setFile('source/main.bs', `
                    class Greeter
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        sub sayHello(name as string, age as integer)
                        end sub
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 42, 'sub sayHello(name as string, age as integer)', 0);
            });
            it('gets help when on second param', () => {
                program.setFile('source/main.bs', `
                    class Greeter
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        sub sayHello(name as string, age as integer)
                        end sub
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 49, 'sub sayHello(name as string, age as integer)', 1);
            });
        });
        describe('gets signature info for overridden class function call', () => {
            it('gets help when on first param', () => {
                program.setFile('source/main.bs', `
                    class Greeter extends Person
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        override sub sayHello(name as string, age as integer)
                        end sub

                        end class
                        class Person
                            sub sayHello(name as string, age as integer)
                            end sub
                        end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 43, 'sub sayHello(name as string, age as integer)', 0);
            });
            it('gets help when on second param', () => {
                program.setFile('source/main.bs', `
                    class Greeter extends Person
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        override sub sayHello(name as string, age as integer)
                        end sub

                        end class
                        class Person
                            sub sayHello(name as string, age as integer)
                            end sub
                        end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 49, 'sub sayHello(name as string, age as integer)', 1);
            });
        });
        describe('gets signature info for overridden super method function call', () => {
            it('gets help when on first param', () => {
                program.setFile('source/main.bs', `
                    class Greeter extends Person
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        override sub sayHello(name as string, age as integer)
                        end sub

                        end class
                        class Person
                            sub sayHello(name as string, age as integer)
                            end sub
                        end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 43, 'sub sayHello(name as string, age as integer)', 0);
            });
            it('gets help when on first param', () => {
                program.setFile('source/main.bs', `
                    class Greeter extends Person
                        sub greet()
                            m.sayHello("name", 12)
                        end sub
                        override sub sayHello(name as string, age as integer)
                        end sub

                        end class
                        class Person
                            sub sayHello(name as string, age as integer)
                            end sub
                        end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 49, 'sub sayHello(name as string, age as integer)', 1);
            });
        });
        describe('gets signature info for nested function call', () => {
            it('gets signature info for the outer function - index 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        outer([inner(["apple"], 100)], 12)
                    end sub

                    sub outer(name as string, age as integer)
                    end sub

                    sub inner(fruits as object, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 36, 'sub outer(name as string, age as integer)', 0);
            });
            it('gets signature info for the outer function - index 1', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        outer([inner(["apple"], 100)], 12)
                    end sub

                    sub outer(name as string, age as integer)
                    end sub

                    sub inner(fruits as object, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 57, 'sub outer(name as string, age as integer)', 1);
            });
            it('gets signature info for the inner function - name', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        outer([inner(["apple"], 100)], 12)
                    end sub

                    sub outer(name as string, age as integer)
                    end sub

                    sub inner(fruits as object, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 43, 'sub inner(fruits as object, age as integer)', 0);
            });
            it('gets signature info for the inner function - param 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        outer([inner(["apple"], 100)], 12)
                    end sub

                    sub outer(name as string, age as integer)
                    end sub

                    sub inner(fruits as object, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 51, 'sub inner(fruits as object, age as integer)', 1);
            });
            it('gets signature info for the inner function - param 1', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        outer([inner(["apple"], 100)], 12)
                    end sub

                    sub outer(name as string, age as integer)
                    end sub

                    sub inner(fruits as object, age as integer)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 48, 'sub inner(fruits as object, age as integer)', 1);
            });
        });
        describe('classes', () => {
            it('gives signature help in constructors', () => {
                program.setFile('source/main.bs', `
                    sub test()
                        p = new Person("george", 20, "text")
                    end sub
                    class Person
                        function new(name as string, age as integer, n2 as string)
                        end function
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 40; i < 48; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 0);
                }
                for (let i = 48; i < 52; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 1);
                }
                for (let i = 52; i < 60; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 2);
                }
            });
            it('gives signature help for class with no constructor', () => {
                program.setFile('source/main.bs', `
                    sub test()
                        p = new Person()
                    end sub
                    class Person
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 40, 'Person()', 0);
            });
            it('gives signature help for base constructor', () => {
                program.setFile('source/main.bs', `
                    sub test()
                        p = new Person("george", 20, "text")
                    end sub
                    class Person extends Being
                    end class
                    class Being
                        function new(name as string, age as integer, n2 as string)
                        end function
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 40; i < 48; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 0);
                }
                for (let i = 48; i < 52; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 1);
                }
                for (let i = 52; i < 60; i++) {
                    assertSignatureHelp(2, i, 'Person(name as string, age as integer, n2 as string)', 2);
                }
            });
            it('gives signature help in constructors in namespaced class', () => {
                program.setFile('source/main.bs', `
                    sub test()
                        p = new being.human.Person("george", 20, "text")
                    end sub
                    namespace being.human
                        class Person
                            function new(name as string, age as integer, n2 as string)
                            end function
                        end class
                    end namespace
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 52; i < 60; i++) {
                    assertSignatureHelp(2, i, 'being.human.Person(name as string, age as integer, n2 as string)', 0);
                }
                for (let i = 60; i < 64; i++) {
                    assertSignatureHelp(2, i, 'being.human.Person(name as string, age as integer, n2 as string)', 1);
                }
                for (let i = 64; i < 72; i++) {
                    assertSignatureHelp(2, i, 'being.human.Person(name as string, age as integer, n2 as string)', 2);
                }
            });
        });
        describe('edge cases', () => {
            it('still gives signature help on commas', () => {
                program.setFile('source/main.bs', `
                    class Person
                        function sayHello(name as string, age as integer, n2 as string)
                        end function

                        function yes(a as string)
                            m.sayHello("george",m.yes("a"),
                            m.yes(""))
                        end function
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 42; i < 48; i++) {
                    assertSignatureHelp(6, i, 'function sayHello(name as string, age as integer, n2 as string)', 0);
                }
                for (let i = 48; i < 54; i++) {
                    assertSignatureHelp(6, i, 'function sayHello(name as string, age as integer, n2 as string)', 1);
                }
                for (let i = 54; i < 58; i++) {
                    assertSignatureHelp(6, i, 'function yes(a as string)', 0);
                }
            });
            it('still gives signature help on spaces', () => {
                program.setFile('source/main.bs', `
                    class Person
                        function sayHello(name as string, age as integer, n2 as string)
                        end function

                        function yes(a as string)
                            m.sayHello("george", m.yes("a"),
                            m.yes(""))
                        end function
                    end class
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 42; i < 48; i++) {
                    assertSignatureHelp(6, i, 'function sayHello(name as string, age as integer, n2 as string)', 0);
                }
                for (let i = 48; i < 55; i++) {
                    assertSignatureHelp(6, i, 'function sayHello(name as string, age as integer, n2 as string)', 1);
                }
                for (let i = 55; i < 58; i++) {
                    assertSignatureHelp(6, i, 'function yes(a as string)', 0);
                }
                for (let i = 0; i < 33; i++) {
                    assertSignatureHelp(7, i, 'function sayHello(name as string, age as integer, n2 as string)', 2);
                }
            });
        });
        describe('gets signature info for function calls that go over a line', () => {
            it('gets signature info for the outer function - index 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                for (let i = 34; i < 42; i++) {
                    assertSignatureHelp(2, i, 'sub sayHello(name as string, age as integer)', 0);
                }
            });
            it('gets signature info for the outer function - end of index 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(8, 25, 'sub sayHello(name as string, age as integer)', 0);
            });
            it('gets signature info for the outer function - index 1', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(8, 30, 'sub sayHello(name as string, age as integer)', 1);
            });
            it('gets signature info for the inner function - param 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(3, 31, 'sub getName(fruits as object, age as function)', 0);
                assertSignatureHelp(4, 31, 'sub getName(fruits as object, age as function)', 0);
            });
            it('gets signature info for the inner function - param 1 - function declartion', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(5, 31, 'sub getName(fruits as object, age as function)', 1);
            });
            it('gets signature info for the inner function - param 1 - in anon function', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        sayHello([getName([
                            "apple"
                            "pear"
                        ], function()
                            return 10
                        end function
                        )], 12)
                    end sub

                    sub sayHello(name as string, age as integer)
                    end sub

                    sub getName(fruits as object, age as function)
                    end sub
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(6, 31, 'sub getName(fruits as object, age as function)', 1);
            });
        });
        describe('gets signature info for namespace function call', () => {
            it('gets signature info function - index 0', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        person.greeter.sayHello("hey", 12)
                    end sub
                    sub sayHello(notThisOne = true)
                    end sub
                    namespace person.greeter
                        sub sayHello(name as string, age as integer)
                        end sub
                    end namespace
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 49, 'sub person.greeter.sayHello(name as string, age as integer)', 0);
            });
            it('gets signature info for the outer function - index 1', () => {
                program.setFile('source/main.bs', `
                    sub main()
                        person.greeter.sayHello("hey", 12)
                    end sub
                    sub sayHello(notThisOne = true)
                    end sub
                    namespace person.greeter
                        sub sayHello(name as string, age as integer)
                        end sub
                    end namespace
                `);
                program.validate();
                (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
                assertSignatureHelp(2, 57, 'sub person.greeter.sayHello(name as string, age as integer)', 1);
            });
        });
        it('gets signature help for partially typed line', () => {
            program.setFile('source/main.bs', `
                function main()
                    thing@.test(a1
                end function
                function test(arg1, arg2, arg3)
                end function
                `);
            program.setFile('components/MyNode.bs', `
                function test(arg1, arg2, arg3)
                end function
                `);
            program.setFile('components/MyNode.xml', (0, testHelpers_spec_1.trim) `<?xml version="1.0" encoding="utf-8" ?>
            <component name="Component1" extends="Scene">
                <script type="text/brightscript" uri="pkg:/components/MyNode.bs" />
                <interface>
                    <function name="test"/>
                </interface>
            </component>`);
            program.validate();
            for (let col = 32; col < 33; col++) {
                let signatureHelp = (program.getSignatureHelp(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, col)));
                (0, chai_config_spec_1.expect)(signatureHelp, `failed on col ${col}`).to.have.lengthOf(1);
                (0, chai_config_spec_1.expect)(signatureHelp[0].index, `failed on col ${col}`).to.equal(0);
            }
        });
        it('does not crash on malformed function declaration with trailing comma', () => {
            program.setFile('source/main.bs', `
                sub test(p1 = invalid,
                    result = 1
                end sub
            `);
            program.validate();
            // Try to get signature help at the position after the comma
            // This should not crash even though the function declaration is malformed
            const signatureHelp = program.getSignatureHelp(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(1, 34));
            // We don't necessarily expect specific results, just that it doesn't crash
            (0, chai_config_spec_1.expect)(signatureHelp).to.be.an('array');
        });
        it('does not crash on incomplete function call', () => {
            program.setFile('source/main.bs', `
                function main()
                    someFunction(
                end function
                function someFunction(param1 as string)
                end function
            `);
            program.validate();
            // Try to get signature help after the opening parenthesis
            const signatureHelp = program.getSignatureHelp(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(2, 32));
            // We don't necessarily expect specific results, just that it doesn't crash
            (0, chai_config_spec_1.expect)(signatureHelp).to.be.an('array');
        });
        it('does not crash on malformed function declaration with missing closing paren', () => {
            program.setFile('source/main.bs', `
                sub test(p1 = invalid
                    result = 1
                end sub
            `);
            program.validate();
            // Try to get signature help at the position where closing paren should be
            const signatureHelp = program.getSignatureHelp(`${testHelpers_spec_2.rootDir}/source/main.bs`, vscode_languageserver_1.Position.create(1, 33));
            // We don't necessarily expect specific results, just that it doesn't crash
            (0, chai_config_spec_1.expect)(signatureHelp).to.be.an('array');
        });
    });
    describe('plugins', () => {
        it('emits file validation events', () => {
            const plugin = {
                name: 'test',
                beforeFileValidate: sinon.spy(),
                onFileValidate: sinon.spy(),
                afterFileValidate: sinon.spy()
            };
            program.plugins.add(plugin);
            program.setFile('source/main.brs', '');
            program.validate();
            (0, chai_config_spec_1.expect)(plugin.beforeFileValidate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(plugin.onFileValidate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(plugin.afterFileValidate.callCount).to.equal(1);
        });
        it('emits file validation events', () => {
            const plugin = {
                name: 'test',
                beforeFileValidate: sinon.spy(),
                onFileValidate: sinon.spy(),
                afterFileValidate: sinon.spy()
            };
            program.plugins.add(plugin);
            program.setFile('components/main.xml', '');
            program.validate();
            (0, chai_config_spec_1.expect)(plugin.beforeFileValidate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(plugin.onFileValidate.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(plugin.afterFileValidate.callCount).to.equal(1);
        });
        it('emits program dispose event', () => {
            const plugin = {
                name: 'test',
                beforeProgramDispose: sinon.spy()
            };
            program.plugins.add(plugin);
            program.dispose();
            (0, chai_config_spec_1.expect)(plugin.beforeProgramDispose.callCount).to.equal(1);
        });
    });
    describe('getScopesForFile', () => {
        it('returns empty array when no scopes were found', () => {
            (0, chai_config_spec_1.expect)(program.getScopesForFile('does/not/exist')).to.eql([]);
        });
    });
    describe('findFilesForEnum', () => {
        it('finds files', () => {
            const file = program.setFile('source/main.bs', `
                enum Direction
                    up
                    down
                end enum
            `);
            (0, chai_config_spec_1.expect)(program.findFilesForEnum('Direction').map(x => x.srcPath)).to.eql([
                file.srcPath
            ]);
        });
    });
    describe('manifest', () => {
        beforeEach(() => {
            fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
            fsExtra.writeFileSync(`${testHelpers_spec_2.tempDir}/manifest`, (0, testHelpers_spec_1.trim) `
                # Channel Details
                title=sample manifest
                major_version=2
                minor_version=0
                build_version=0
                supports_input_launch=1
                bs_const=DEBUG=false
            `);
            program.options = util_1.util.normalizeConfig({
                rootDir: testHelpers_spec_2.tempDir
            });
        });
        afterEach(() => {
            fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
            program.dispose();
        });
        it('loads the manifest from project root', () => {
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('DEBUG=false');
        });
        it('loads the manifest from a FileObj', () => {
            fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
            fsExtra.ensureDirSync(`${testHelpers_spec_2.tempDir}/someDeepDir`);
            fsExtra.writeFileSync(`${testHelpers_spec_2.tempDir}/someDeepDir/manifest`, (0, testHelpers_spec_1.trim) `
                # Channel Details
                title=sample manifest
                major_version=2
                minor_version=0
                build_version=0
                supports_input_launch=1
                bs_const=DEBUG=false
            `);
            program.loadManifest({
                src: `${testHelpers_spec_2.tempDir}/someDeepDir/manifest`,
                dest: 'manifest'
            });
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('DEBUG=false');
        });
        it('adds a const to the manifest', () => {
            program.options.manifest = {
                // eslint-disable-next-line camelcase
                bs_const: {
                    NEW_VALUE: false
                }
            };
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('DEBUG=false;NEW_VALUE=false');
        });
        it('changes a const in the manifest', () => {
            program.options.manifest = {
                // eslint-disable-next-line camelcase
                bs_const: {
                    DEBUG: true
                }
            };
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('DEBUG=true');
        });
        it('removes a const in the manifest', () => {
            program.options.manifest = {
                // eslint-disable-next-line camelcase
                bs_const: {
                    DEBUG: null
                }
            };
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('');
        });
        it('handles no consts in the manifest', () => {
            fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
            fsExtra.writeFileSync(`${testHelpers_spec_2.tempDir}/manifest`, (0, testHelpers_spec_1.trim) `
                # Channel Details
                title=sample manifest
                major_version=2
                minor_version=0
                build_version=0
                supports_input_launch=1
            `);
            let manifest = program.getManifest();
            testCommonManifestValues(manifest);
            (0, chai_config_spec_1.expect)(manifest.get('bs_const')).to.equal('');
        });
        function testCommonManifestValues(manifest) {
            (0, chai_config_spec_1.expect)(manifest.get('title')).to.equal('sample manifest');
            (0, chai_config_spec_1.expect)(manifest.get('major_version')).to.equal('2');
            (0, chai_config_spec_1.expect)(manifest.get('minor_version')).to.equal('0');
            (0, chai_config_spec_1.expect)(manifest.get('build_version')).to.equal('0');
            (0, chai_config_spec_1.expect)(manifest.get('supports_input_launch')).to.equal('1');
        }
    });
});
//# sourceMappingURL=Program.spec.js.map