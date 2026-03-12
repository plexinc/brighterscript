"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const path = require("path");
const sinonImport = require("sinon");
const vscode_languageserver_1 = require("vscode-languageserver");
const fsExtra = require("fs-extra");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const Program_1 = require("../Program");
const BrsFile_1 = require("./BrsFile");
const XmlFile_1 = require("./XmlFile");
const util_1 = require("../util");
const testHelpers_spec_1 = require("../testHelpers.spec");
const ProgramBuilder_1 = require("../ProgramBuilder");
const logging_1 = require("../logging");
const reflection_1 = require("../astUtils/reflection");
const testHelpers_spec_2 = require("../testHelpers.spec");
describe('XmlFile', () => {
    let program;
    let sinon = sinonImport.createSandbox();
    let file;
    let testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        fsExtra.emptyDirSync(testHelpers_spec_2.tempDir);
        fsExtra.ensureDirSync(testHelpers_spec_2.rootDir);
        fsExtra.ensureDirSync(testHelpers_spec_2.stagingDir);
        program = new Program_1.Program({ rootDir: testHelpers_spec_2.rootDir });
        file = new XmlFile_1.XmlFile(`${testHelpers_spec_2.rootDir}/components/MainComponent.xml`, 'components/MainComponent.xml', program);
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    describe('parse', () => {
        it('allows modifying the parsed XML model', () => {
            const expected = 'OtherName';
            program.plugins.add({
                name: 'allows modifying the parsed XML model',
                afterFileParse: (file) => {
                    var _a, _b, _c;
                    if ((0, reflection_1.isXmlFile)(file) && ((_c = (_b = (_a = file.parser.ast.root) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value)) {
                        file.parser.ast.root.attributes[0].value.text = expected;
                    }
                }
            });
            file = program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="Scene">
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.componentName.text).to.equal(expected);
        });
        it('only removes specified attribute when calling setAttribute', () => {
            file = new XmlFile_1.XmlFile('abs', 'rel', program);
            program.plugins.add({
                name: 'allows modifying the parsed XML model',
                afterFileParse: () => {
                    let child = file.parser.ast.component.children.children[0];
                    (0, chai_config_spec_1.expect)(child.attributes).to.have.lengthOf(4);
                    child.setAttribute('text', undefined);
                    (0, chai_config_spec_1.expect)(child.getAttribute('id').value.text).to.equal('one');
                    (0, chai_config_spec_1.expect)(child.attributes).to.have.lengthOf(3);
                    child.setAttribute('text3', undefined);
                    (0, chai_config_spec_1.expect)(child.getAttribute('id').value.text).to.equal('one');
                    (0, chai_config_spec_1.expect)(child.attributes).to.have.lengthOf(2);
                }
            });
            file.parse((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="Scene">
                    <script type="text/brightscript" uri="ChildScene1.brs" /> <script type="text/brightscript" uri="ChildScene2.brs" /> <script type="text/brightscript" uri="ChildScene3.brs" />
                    <children>
                    <Label id="one"
                        text="two"
                        text2="three"
                        text3="four"
                    />
                    </children>
                </component>
            `);
        });
        it('supports importing BrighterScript files', () => {
            file = program.setFile('components/custom.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="Scene">
                    <script type="text/brightscript" uri="ChildScene.bs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.scriptTagImports.map(x => x.pkgPath)[0]).to.equal((0, util_1.standardizePath) `components/ChildScene.bs`);
        });
        it('does not include commented-out script imports', () => {
            var _a, _b;
            file = program.setFile('components/custom.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="Scene">
                    <script type="text/brightscript" uri="ChildScene.brs" />
                    <!--
                        <script type="text/brightscript" uri="ChildScene.brs" />
                    -->
                </component>
            `);
            (0, chai_config_spec_1.expect)((_b = (_a = file.scriptTagImports) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.pkgPath).to.eql((0, util_1.standardizePath) `components/ChildScene.brs`);
        });
        it('finds scripts when more than one per line', () => {
            file = new XmlFile_1.XmlFile('abs', 'rel', program);
            file.parse((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="Scene">
                    <script type="text/brightscript" uri="ChildScene1.brs" /> <script type="text/brightscript" uri="ChildScene2.brs" /> <script type="text/brightscript" uri="ChildScene3.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.scriptTagImports).to.be.lengthOf(3);
            (0, chai_config_spec_1.expect)(file.scriptTagImports[0]).to.deep.include({
                text: 'ChildScene1.brs',
                filePathRange: vscode_languageserver_1.Range.create(2, 42, 2, 57)
            });
            (0, chai_config_spec_1.expect)(file.scriptTagImports[1]).to.deep.include({
                text: 'ChildScene2.brs',
                filePathRange: vscode_languageserver_1.Range.create(2, 100, 2, 115)
            });
            (0, chai_config_spec_1.expect)(file.scriptTagImports[2]).to.deep.include({
                text: 'ChildScene3.brs',
                filePathRange: vscode_languageserver_1.Range.create(2, 158, 2, 173)
            });
        });
        it('finds component names', () => {
            file = new XmlFile_1.XmlFile('abs', 'rel', program);
            file.parse((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="ChildScene.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.parentComponentName.text).to.equal('ParentScene');
            (0, chai_config_spec_1.expect)(file.componentName.text).to.equal('ChildScene');
        });
        it('Adds error when whitespace appears before the prolog', () => {
            file = new XmlFile_1.XmlFile('abs', 'rel', program);
            file.parse(/* not trimmed */ `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <script type="text/brightscript" uri="ChildScene.brs" />
                </component>`);
            (0, chai_config_spec_1.expect)(file.diagnostics).to.be.lengthOf(2);
            (0, chai_config_spec_1.expect)(file.diagnostics[0]).to.deep.include({
                code: DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('').code,
                range: vscode_languageserver_1.Range.create(1, 16, 1, 22)
            });
            (0, chai_config_spec_1.expect)(file.diagnostics[1]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('Syntax error: whitespace found before the XML prolog')), { range: vscode_languageserver_1.Range.create(0, 0, 1, 16) }));
        });
        it('Adds error when an unknown tag is found in xml', () => {
            file = new XmlFile_1.XmlFile('abs', 'rel', program);
            file.parse((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="ParentScene">
                    <interface>
                        <unexpected />
                    </interface>
                    <unexpectedToo />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.diagnostics).to.be.lengthOf(2);
            (0, chai_config_spec_1.expect)(file.diagnostics[0]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag('unexpected')), { range: vscode_languageserver_1.Range.create(3, 9, 3, 19) }));
            (0, chai_config_spec_1.expect)(file.diagnostics[1]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag('unexpectedToo')), { range: vscode_languageserver_1.Range.create(5, 5, 5, 18) }));
        });
        it('Adds error when no component is declared in xml', () => {
            program.setFile('components/comp.xml', '<script type="text/brightscript" uri="ChildScene.brs" />');
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag('script')), { range: vscode_languageserver_1.Range.create(0, 1, 0, 7) }),
                DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingComponentDeclaration()
            ]);
        });
        it('adds error when component does not declare a name', () => {
            file = program.setFile('components/comp.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component extends="ParentScene">
                    <script type="text/brightscript" uri="ChildScene.brs" />
                </component>
            `);
            program.validate();
            (0, chai_config_spec_1.expect)(file.diagnostics).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(file.diagnostics[0]).to.deep.include({
                message: DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingNameAttribute().message,
                range: vscode_languageserver_1.Range.create(1, 1, 1, 10)
            });
        });
        it('catches xml parse errors', () => {
            file = program.setFile('components/comp.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component 1extends="ParentScene">
                </component>
            `);
            program.validate();
            (0, chai_config_spec_1.expect)(file.diagnostics).to.be.lengthOf(2);
            (0, chai_config_spec_1.expect)(file.diagnostics[0].code).to.equal(DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('').code); //unexpected character '1'
            (0, chai_config_spec_1.expect)(file.diagnostics[1]).to.deep.include({
                code: DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingNameAttribute().code,
                range: vscode_languageserver_1.Range.create(1, 1, 1, 10)
            });
        });
        it('finds script imports', () => {
            file = new XmlFile_1.XmlFile('abspath/components/cmp1.xml', 'components/cmp1.xml', program);
            file.parse((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Cmp1" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/components/cmp1.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.scriptTagImports.length).to.equal(1);
            (0, chai_config_spec_1.expect)(file.scriptTagImports[0]).to.deep.include({
                sourceFile: file,
                text: 'pkg:/components/cmp1.brs',
                pkgPath: `components${path.sep}cmp1.brs`,
                filePathRange: vscode_languageserver_1.Range.create(2, 42, 2, 66)
            });
        });
        it('throws an error if the file has already been parsed', () => {
            file = new XmlFile_1.XmlFile('abspath', 'relpath', program);
            file.parse('a comment');
            try {
                file.parse(`'a new comment`);
                chai_config_spec_1.assert.fail(null, null, 'Should have thrown an exception, but did not');
            }
            catch (e) {
                //test passes
            }
        });
        it('resolves relative paths', () => {
            file = program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Cmp1" extends="Scene">
                    <script type="text/brightscript" uri="cmp1.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.scriptTagImports.length).to.equal(1);
            (0, chai_config_spec_1.expect)(file.scriptTagImports[0]).to.deep.include({
                text: 'cmp1.brs',
                pkgPath: `components${path.sep}cmp1.brs`
            });
        });
        it('finds correct position for empty uri in script tag', () => {
            var _a;
            file = program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Cmp1" extends="Scene">
                    <script type="text/brightscript" uri="" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.scriptTagImports.length).to.equal(1);
            (0, chai_config_spec_1.expect)((_a = file.scriptTagImports[0]) === null || _a === void 0 ? void 0 : _a.filePathRange).to.eql(vscode_languageserver_1.Range.create(2, 42, 2, 42));
        });
    });
    describe('doesReferenceFile', () => {
        it('compares case insensitive', () => {
            let xmlFile = program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Cmp1" extends="Scene">
                    <script type="text/brightscript" uri="HeroGrid.brs" />
                </component>
            `);
            let brsFile = program.setFile(`components/HEROGRID.brs`, ``);
            (0, chai_config_spec_1.expect)(xmlFile.doesReferenceFile(brsFile)).to.be.true;
        });
    });
    describe('autoImportComponentScript', () => {
        it('is not enabled by default', () => {
            program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="GrandparentScene">
                    <script type="text/brightscript" uri="./lib.brs" />
                </component>
            `);
            program.setFile('components/lib.brs', `
                function libFunc()
                end function
            `);
            program.setFile('components/comp1.bs', `
                function init()
                    libFunc()
                end function
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.fileNotReferencedByAnyOtherFile()
            ]);
        });
        it('is not enabled by default', () => {
            program = new Program_1.Program({
                rootDir: testHelpers_spec_2.rootDir,
                autoImportComponentScript: true
            });
            program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="GrandparentScene">
                    <script type="text/brightscript" uri="./lib.brs" />
                </component>
            `);
            program.setFile('components/lib.brs', `
                function libFunc()
                end function
            `);
            program.setFile('components/comp1.bs', `
                function init()
                    libFunc()
                end function
            `);
            program.validate();
            //there should be no errors
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('getCompletions', () => {
        it('formats completion paths with proper slashes', () => {
            let scriptPath = (0, util_1.standardizePath) `C:/app/components/component1/component1.brs`;
            program.files[scriptPath] = new BrsFile_1.BrsFile(scriptPath, (0, util_1.standardizePath) `components/component1/component1.brs`, program);
            let xmlFile = new XmlFile_1.XmlFile((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/component1/component1.xml`, (0, util_1.standardizePath) `components/component1/component1.xml`, program);
            xmlFile.parser.references.scriptTagImports.push({
                pkgPath: (0, util_1.standardizePath) `components/component1/component1.brs`,
                text: 'component1.brs',
                filePathRange: vscode_languageserver_1.Range.create(1, 1, 1, 1)
            });
            (0, chai_config_spec_1.expect)(xmlFile.getCompletions(vscode_languageserver_1.Position.create(1, 1))[0]).to.include({
                label: 'component1.brs',
                kind: vscode_languageserver_1.CompletionItemKind.File
            });
            (0, chai_config_spec_1.expect)(xmlFile.getCompletions(vscode_languageserver_1.Position.create(1, 1))[1]).to.include({
                label: 'pkg:/components/component1/component1.brs',
                kind: vscode_languageserver_1.CompletionItemKind.File
            });
        });
        it('returns empty set when out of range', () => {
            program.setFile('components/component1.brs', ``);
            (0, chai_config_spec_1.expect)(file.getCompletions(vscode_languageserver_1.Position.create(99, 99))).to.be.empty;
        });
        //TODO - refine this test once cdata scripts are supported
        it('prevents scope completions entirely', () => {
            program.setFile('components/component1.brs', ``);
            let xmlFile = program.setFile('components/component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentScene" extends="GrandparentScene">
                    <script type="text/brightscript" uri="./Component1.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(program.getCompletions(xmlFile.srcPath, vscode_languageserver_1.Position.create(1, 1))).to.be.empty;
        });
    });
    describe('getAllDependencies', () => {
        it('returns own imports', () => {
            file = program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildScene" extends="BaseScene">
                    <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.getOwnDependencies().sort()).to.eql([
                (0, util_1.standardizePath) `source/lib.brs`,
                (0, util_1.standardizePath) `source/lib.d.bs`
            ]);
        });
    });
    it('invalidates dependent scopes on change', () => {
        let xmlFile = program.setFile({
            src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
            dest: `components/comp1.xml`
        }, (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="BaseScene">
                <script type="text/brightscript" uri="pkg:/source/lib.bs" />
            </component>
        `);
        program.validate();
        let scope = program.getScopesForFile(xmlFile)[0];
        //scope should be validated
        (0, chai_config_spec_1.expect)(scope.isValidated);
        //add lib1
        program.setFile(`source/lib.bs`, ``);
        //adding a dependent file should have invalidated the scope
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.false;
        program.validate();
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.true;
        //update lib1 to include an import
        program.setFile(`source/lib.bs`, `
            import "lib2.bs"
        `);
        //scope should have been invalidated again
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.false;
        program.validate();
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.true;
        //add the lib2 imported from lib
        program.setFile(`source/lib2.bs`, ``);
        //scope should have been invalidated again because of chained dependency
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.false;
        program.validate();
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.true;
        program.removeFile(`${testHelpers_spec_2.rootDir}/source/lib.bs`);
        (0, chai_config_spec_1.expect)(scope.isValidated).to.be.false;
    });
    it('does not invalidate unrelated scopes on change', () => {
        let xmlFile1 = program.setFile({
            src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
            dest: `components/comp1.xml`
        }, (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene1" extends="BaseScene">
                <script type="text/brightscript" uri="pkg:/source/lib.brs" />
            </component>
        `);
        let xmlFile2 = program.setFile({
            src: `${testHelpers_spec_2.rootDir}/components/comp2.xml`,
            dest: `components/comp2.xml`
        }, (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene2" extends="BaseScene">
            </component>
        `);
        program.validate();
        //scope should be validated
        (0, chai_config_spec_1.expect)(program.getScopesForFile(xmlFile1)[0].isValidated).to.be.true;
        (0, chai_config_spec_1.expect)(program.getScopesForFile(xmlFile2)[0].isValidated).to.be.true;
        //add the lib file
        program.setFile(`source/lib.brs`, ``);
        (0, chai_config_spec_1.expect)(program.getScopesForFile(xmlFile1)[0].isValidated).to.be.false;
        (0, chai_config_spec_1.expect)(program.getScopesForFile(xmlFile2)[0].isValidated).to.be.true;
    });
    it('allows adding diagnostics', () => {
        const expected = [{
                message: 'message',
                file: undefined,
                range: undefined
            }];
        file.addDiagnostics(expected);
        (0, testHelpers_spec_1.expectDiagnostics)(file, expected);
    });
    describe('component extends', () => {
        it('works for single-line', () => {
            file = program.setFile({
                src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
                dest: `components/comp1.xml`
            }, (0, testHelpers_spec_1.trim) `
                    <?xml version="1.0" encoding="utf-8" ?>
                    <component name="ChildScene" extends="BaseScene">
                    </component>
                `);
            (0, chai_config_spec_1.expect)(file.parentComponentName.range).to.eql(vscode_languageserver_1.Range.create(1, 38, 1, 47));
        });
        it('works for multi-line', () => {
            file = program.setFile({
                src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
                dest: `components/comp1.xml`
            }, (0, testHelpers_spec_1.trim) `
                    <?xml version="1.0" encoding="utf-8" ?>
                    <component name="ChildScene"
                        extends="BaseScene">
                    </component>
                `);
            (0, chai_config_spec_1.expect)(file.parentComponentName.range).to.eql(vscode_languageserver_1.Range.create(2, 13, 2, 22));
        });
        it('does not throw when unable to find extends', () => {
            file = program.setFile({
                src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
                dest: `components/comp1.xml`
            }, (0, testHelpers_spec_1.trim) `
                    <?xml version="1.0" encoding="utf-8" ?>
                    <component name="ChildScene">
                    </component>
                `);
            (0, chai_config_spec_1.expect)(file.parentComponentName).to.not.exist;
        });
        it('adds warning when no "extends" attribute is found', () => {
            program.setFile({
                src: `${testHelpers_spec_2.rootDir}/components/comp1.xml`,
                dest: `components/comp1.xml`
            }, (0, testHelpers_spec_1.trim) `
                    <?xml version="1.0" encoding="utf-8" ?>
                    <component name="ChildScene">
                    </component>
                `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingExtendsAttribute()
            ]);
        });
    });
    it('detects when importing the codebehind file unnecessarily', () => {
        program = new Program_1.Program({
            autoImportComponentScript: true,
            rootDir: testHelpers_spec_2.rootDir
        });
        program.setFile(`components/SimpleScene.bs`, '');
        program.setFile(`components/SimpleScene.xml`, (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="SimpleScene" extends="Scene">
                <script type="text/brighterscript" uri="SimpleScene.bs" />
            </component>
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.unnecessaryCodebehindScriptImport()
        ]);
    });
    describe('transpile', () => {
        it('handles single quotes properly', () => {
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="AnimationExample" extends="Scene">
                    <children>
                        <Animated frames='["pkg:/images/animation-1.png"]' />
                    </children>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="AnimationExample" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                    <children>
                        <Animated frames='["pkg:/images/animation-1.png"]' />
                    </children>
                </component>
            `, 'none', 'components/Comp.xml');
        });
        it('supports instantresume <customization> elements', async () => {
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/manifest`, '');
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/source/main.brs`, `sub main()\nend sub`);
            fsExtra.outputFileSync(`${testHelpers_spec_2.rootDir}/components/MainScene.xml`, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="MainScene" extends="Scene">
                    <customization resumehandler="customResume" />
                    <customization suspendhandler="customSuspend" />
                    <children>
                        <Rectangle width="1920" height="1080" />
                    </children>
                </component>
            `);
            const builder = new ProgramBuilder_1.ProgramBuilder();
            await builder.run({
                cwd: testHelpers_spec_2.rootDir,
                retainStagingDir: true,
                stagingDir: testHelpers_spec_2.stagingDir,
                logLevel: logging_1.LogLevel.off
            });
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/components/MainScene.xml`).toString())).to.eql((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="MainScene" extends="Scene">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                    <children>
                        <Rectangle width="1920" height="1080" />
                    </children>
                    <customization resumehandler="customResume" />
                    <customization suspendhandler="customSuspend" />
                </component>
            `);
        });
        it(`honors the 'needsTranspiled' flag when set in 'afterFileParse'`, () => {
            program.plugins.add({
                name: 'test',
                afterFileParse: (file) => {
                    //enable transpile for every file
                    file.needsTranspiled = true;
                }
            });
            const file = program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.needsTranspiled).to.be.true;
        });
        it('includes bslib script', () => {
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/Comp.xml');
        });
        it('does not include additional bslib script if already there ', () => {
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/child.xml');
        });
        it('does not include bslib script if already there from ropm', () => {
            program.setFile('source/roku_modules/bslib/bslib.brs', ``);
            program.setFile('source/lib.bs', ``);
            //include a bs file to force transpile for the xml file
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/lib.bs" />
                    <script type="text/brightscript" uri="pkg:/source/roku_modules/bslib/bslib.brs" />
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                    <script type="text/brightscript" uri="pkg:/source/roku_modules/bslib/bslib.brs" />
                </component>
            `, 'none', 'components/child.xml');
        });
        it('does not transpile xml file when bslib script is already present', () => {
            const file = program.setFile('components/comp.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Comp" extends="Group">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            (0, chai_config_spec_1.expect)(file.needsTranspiled).to.be.false;
        });
        /**
         * There was a bug that would incorrectly replace one of the script paths on the second or third transpile, so this test verifies it doesn't do that anymore
         */
        it('does not mangle scripts on multiple transpile', async () => {
            program.setFile('components/SimpleScene.bs', ``);
            program.setFile(`components/SimpleScene.xml`, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script type="text/brightscript" uri="SimpleScene.bs" />
                </component>
            `);
            const expected = (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script type="text/brightscript" uri="SimpleScene.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `;
            await program.transpile([], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/components/SimpleScene.xml`).toString())).to.eql(expected);
            //clear the output folder
            fsExtra.emptyDirSync(testHelpers_spec_2.stagingDir);
            await program.transpile([], testHelpers_spec_2.stagingDir);
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trim)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/components/SimpleScene.xml`).toString())).to.eql(expected);
        });
        it('keeps all content of the XML', () => {
            program.setFile(`components/SimpleScene.bs`, `
                sub b()
                end sub
            `);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component
                    name="SimpleScene" extends="Scene"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd"
                >
                    <interface>
                        <field id="a" type="string" />
                        <function name="b" />
                    </interface>
                    <script type="text/brightscript" uri="SimpleScene.bs"/>
                    <children>
                        <aa id="aa">
                            <bb id="bb" />
                        </aa>
                    </children>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd">
                    <interface>
                        <field id="a" type="string" />
                        <function name="b" />
                    </interface>
                    <script type="text/brightscript" uri="SimpleScene.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                    <children>
                        <aa id="aa">
                            <bb id="bb" />
                        </aa>
                    </children>
                </component>
            `, 'none', 'components/SimpleScene.xml');
        });
        it('changes file extensions from bs to brs', () => {
            program.setFile(`components/SimpleScene.bs`, `
                import "pkg:/source/lib.bs"
            `);
            program.setFile('source/lib.bs', ``);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script type="text/brighterscript" uri="SimpleScene.bs"/>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script type="text/brightscript" uri="SimpleScene.brs" />
                    <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/SimpleScene.xml');
        });
        it('does not fail on missing script type', () => {
            program.setFile('components/SimpleScene.brs', '');
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script uri="SimpleScene.brs"/>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                    <script uri="SimpleScene.brs" type="text/brightscript" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, null, 'components/comp.xml');
        });
        it('returns the XML unmodified if needsTranspiled is false', () => {
            let file = program.setFile('components/SimpleScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <!-- should stay as-is -->
                <component name="SimpleScene" extends="Scene" >
                <script type="text/brightscript" uri="SimpleScene.brs"/>
                </component>
            `);
            //prevent the default auto-imports to ensure no transpilation from AST
            file.getMissingImportsForTranspile = () => [];
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(file.transpile().code)).to.equal((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <!-- should stay as-is -->
                <component name="SimpleScene" extends="Scene" >
                <script type="text/brightscript" uri="SimpleScene.brs"/>
                </component>
            `);
        });
        it('needsTranspiled is false by default', () => {
            let file = program.setFile('components/SimpleScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" >
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.needsTranspiled).to.be.false;
        });
        it('needsTranspiled is true if an import is brighterscript', () => {
            let file = program.setFile('components/SimpleScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" >
                    <script type="text/brightscript" uri="SimpleScene.bs"/>
                </component>
            `);
            (0, chai_config_spec_1.expect)(file.needsTranspiled).to.be.true;
        });
        it('simple source mapping includes sourcemap reference', () => {
            program.options.sourceMap = true;
            let file = program.setFile('components/SimpleScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                </component>
            `);
            //prevent the default auto-imports to ensure no transpilation from AST
            file.getMissingImportsForTranspile = () => [];
            const code = file.transpile().code;
            (0, chai_config_spec_1.expect)(code.endsWith(`<!--//# sourceMappingURL=./SimpleScene.xml.map -->`)).to.be.true;
        });
        it('AST-based source mapping includes sourcemap reference', () => {
            program.options.sourceMap = true;
            let file = program.setFile('components/SimpleScene.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene">
                </component>
            `);
            file.needsTranspiled = true;
            const code = file.transpile().code;
            (0, chai_config_spec_1.expect)(code.endsWith(`<!--//# sourceMappingURL=./SimpleScene.xml.map -->`)).to.be.true;
        });
        it('removes script imports if given file is not publishable', () => {
            program.options.pruneEmptyCodeFiles = true;
            program.setFile(`components/SimpleScene.bs`, `
                enum simplescenetypes
                    hero
                    intro
                end enum
            `);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component
                    name="SimpleScene" extends="Scene"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd"
                >
                    <script type="text/brightscript" uri="SimpleScene.bs"/>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd">
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/SimpleScene.xml');
        });
        it('removes extra imports found via dependencies if given file is not publishable', () => {
            program.options.pruneEmptyCodeFiles = true;
            program.setFile(`source/simplescenetypes.bs`, `
                enum SimpleSceneTypes
                    world = "world"
                end enum
            `);
            program.setFile(`components/SimpleScene.bs`, `
                import "pkg:/source/simplescenetypes.bs"

                sub init()
                    ? "Hello " + SimpleSceneTypes.world
                end sub
            `);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component
                    name="SimpleScene" extends="Scene"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd"
                >
                    <script type="text/brightscript" uri="SimpleScene.bs"/>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd">
                    <script type="text/brightscript" uri="SimpleScene.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/SimpleScene.xml');
        });
        it('removes imports of empty brightscript files', () => {
            program.options.pruneEmptyCodeFiles = true;
            program.setFile(`components/EmptyFile.brs`, '');
            program.setFile(`components/SimpleScene.brs`, `
                sub init()
                    ? "Hello World"
                end sub
            `);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component
                    name="SimpleScene" extends="Scene"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd"
                >
                    <script type="text/brightscript" uri="SimpleScene.brs"/>
                    <script type="text/brightscript" uri="EmptyFile.brs"/>
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="SimpleScene" extends="Scene" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd">
                    <script type="text/brightscript" uri="SimpleScene.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/SimpleScene.xml');
        });
    });
    describe('Transform plugins', () => {
        function parseFileWithPlugins(validateXml) {
            const rootDir = process.cwd();
            const program = new Program_1.Program({
                rootDir: rootDir
            });
            program.plugins.add({
                name: 'Transform plugins',
                afterFileParse: file => validateXml(file)
            });
            file = program.setFile('components/component.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Cmp1" extends="Scene">
                </component>
            `);
            program.validate();
            return file;
        }
        it('Calls XML file validation plugins', () => {
            const validateXml = sinon.spy();
            const file = parseFileWithPlugins(validateXml);
            (0, chai_config_spec_1.expect)(validateXml.callCount).to.be.greaterThan(0);
            (0, chai_config_spec_1.expect)(validateXml.getCalls().flatMap(x => x.args)).to.include(file);
        });
    });
    it('plugin diagnostics work for xml files', () => {
        program.plugins.add({
            name: 'Xml diagnostic test',
            afterFileParse: (file) => {
                if (file.srcPath.endsWith('.xml')) {
                    file.addDiagnostics([{
                            file: file,
                            message: 'Test diagnostic',
                            range: vscode_languageserver_1.Range.create(0, 0, 0, 0),
                            code: 9999
                        }]);
                }
            }
        });
        program.setFile('components/comp.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="Cmp1" extends="Scene">
            </component>
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [{
                message: 'Test diagnostic',
                code: 9999
            }]);
    });
    describe('typedef', () => {
        it('loads d.bs files from parent scope', () => {
            program.setFile('components/ParentComponent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentComponent" extends="Scene">
                    <script uri="ParentComponent.brs" />
                </component>
            `);
            program.setFile('components/ParentComponent.d.bs', `
                import "Lib.brs"
                namespace Parent
                    sub log()
                    end sub
                end namespace
            `);
            program.setFile('components/ParentComponent.brs', `
                sub Parent_log()
                end sub
            `);
            program.setFile('components/Lib.d.bs', `
                namespace Lib
                    sub log()
                    end sub
                end namespace
            `);
            program.setFile('components/Lib.brs', `
                sub Lib_log()
                end sub
            `);
            program.setFile('components/ChildComponent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildComponent" extends="ParentComponent">
                    <script uri="ChildComponent.bs" />
                </component>
            `);
            program.setFile('components/ChildComponent.bs', `
                sub init()
                    Parent.log()
                    Lib.log()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
            const scope = program.getComponentScope('ChildComponent');
            (0, chai_config_spec_1.expect)([...scope.namespaceLookup.keys()].sort()).to.eql([
                'lib',
                'parent'
            ]);
        });
        it('loads `d.bs` files into scope', () => {
            const xmlFile = program.setFile('components/Component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script uri="Component1.brs" />
                </component>
            `);
            program.setFile('components/Component1.d.bs', `
                sub logInfo()
                end sub
            `);
            (0, chai_config_spec_1.expect)(program.getScopesForFile(xmlFile)[0].getAllCallables().map(x => x.callable.name)).to.include('logInfo');
        });
        it('does not include `d.bs` script during transpile', () => {
            program.setFile('source/logger.d.bs', `
                sub logInfo()
                end sub
            `);
            program.setFile('source/logger.brs', `
                sub logInfo()
                end sub
            `);
            program.setFile('components/Component1.bs', `
                import "pkg:/source/logger.brs"
                sub init()
                end sub
            `);
            testTranspile((0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brighterscript" uri="Component1.bs" />
                </component>
            `, (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script type="text/brightscript" uri="Component1.brs" />
                    <script type="text/brightscript" uri="pkg:/source/logger.brs" />
                    <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                </component>
            `, 'none', 'components/Component1.xml');
        });
        it('does not load .brs information into scope if related d.bs is in scope', () => {
            const xmlFile = program.setFile('components/Component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script uri="Component1.brs" />
                </component>
            `);
            const scope = program.getScopesForFile(xmlFile)[0];
            //load brs file
            program.setFile('components/Component1.brs', `
                sub logInfo()
                end sub
                sub logWarning()
                end sub
            `);
            let functionNames = scope.getAllCallables().map(x => x.callable.name);
            (0, chai_config_spec_1.expect)(functionNames).to.include('logInfo');
            (0, chai_config_spec_1.expect)(functionNames).to.include('logWarning');
            //load d.bs file, which should shadow out the .brs file
            program.setFile('components/Component1.d.bs', `
                sub logError()
                end sub
            `);
            functionNames = scope.getAllCallables().map(x => x.callable.name);
            (0, chai_config_spec_1.expect)(functionNames).to.include('logError');
            (0, chai_config_spec_1.expect)(functionNames).not.to.include('logInfo');
            (0, chai_config_spec_1.expect)(functionNames).not.to.include('logWarning');
        });
        it('updates xml scope when typedef disappears', () => {
            const xmlFile = program.setFile('components/Component1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Component1" extends="Scene">
                    <script uri="Component1.brs" />
                </component>
            `);
            const scope = program.getScopesForFile(xmlFile)[0];
            //load brs file
            program.setFile('components/Component1.brs', `
                sub logBrs()
                end sub
            `);
            //load d.bs file, which should shadow out the .brs file
            const typedef = program.setFile('components/Component1.d.bs', `
                sub logTypedef()
                end sub
            `);
            program.validate();
            let functionNames = scope.getOwnCallables().map(x => x.callable.name);
            (0, chai_config_spec_1.expect)(functionNames).to.include('logTypedef');
            (0, chai_config_spec_1.expect)(functionNames).not.to.include('logBrs');
            //remove the typdef file
            program.removeFile(typedef.srcPath);
            program.validate();
            functionNames = scope.getOwnCallables().map(x => x.callable.name);
            (0, chai_config_spec_1.expect)(functionNames).not.to.include('logTypedef');
            (0, chai_config_spec_1.expect)(functionNames).to.include('logBrs');
        });
    });
    it('finds script imports for single-quoted script tags', () => {
        var _a;
        const file = program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="Cmp1" extends="Scene">
                <script uri='SingleQuotedFile.brs' />
            </component>
        `);
        (0, chai_config_spec_1.expect)((_a = file.scriptTagImports[0]) === null || _a === void 0 ? void 0 : _a.text).to.eql('SingleQuotedFile.brs');
    });
    describe('commentFlags', () => {
        it('ignores warning from previous line comment', () => {
            //component without a name attribute
            program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <!--bs:disable-next-line-->
                <component>
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('ignores warning from previous line just for the specified code', () => {
            //component without a name attribute
            program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <!--bs:disable-next-line 1006-->
                <component>
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingExtendsAttribute()
            ]);
        });
        it('ignores warning from previous line comment', () => {
            //component without a name attribute
            program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component> <!--bs:disable-line-->
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('ignores warning from previous line just for the specified code', () => {
            //component without a name attribute
            program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component> <!--bs:disable-line 1006-->
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.xmlComponentMissingExtendsAttribute()
            ]);
        });
    });
    describe('duplicate components', () => {
        it('more gracefully handles multiple components with the same name', () => {
            program.setFile('components/comp1.brs', ``);
            program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="comp1" extends="Group">
                    <script uri="comp1.brs" />
                </component>
            `);
            //add another component with the same name
            program.setFile('components/comp2.brs', ``);
            program.setFile('components/comp2.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="comp1" extends="Group">
                    <script uri="comp2.brs" />
                </component>
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program, [
                DiagnosticMessages_1.DiagnosticMessages.duplicateComponentName('comp1'),
                DiagnosticMessages_1.DiagnosticMessages.duplicateComponentName('comp1')
            ]);
        });
        it('maintains consistent component selection', () => {
            //add comp2 first
            const comp2 = program.setFile('components/comp2.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="comp1">
                </component>
            `);
            (0, chai_config_spec_1.expect)(program.getComponent('comp1').file.pkgPath).to.equal(comp2.pkgPath);
            //add comp1. it should become the main component with this name
            const comp1 = program.setFile('components/comp1.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="comp1" extends="Group">
                </component>
            `);
            (0, chai_config_spec_1.expect)(program.getComponent('comp1').file.pkgPath).to.equal(comp1.pkgPath);
            //remove comp1, comp2 should be the primary again
            program.removeFile((0, util_1.standardizePath) `${testHelpers_spec_2.rootDir}/components/comp1.xml`);
            (0, chai_config_spec_1.expect)(program.getComponent('comp1').file.pkgPath).to.equal(comp2.pkgPath);
            //add comp3
            program.setFile('components/comp3.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="comp1">
                </component>
            `);
            //...the 2nd file should still be main
            (0, chai_config_spec_1.expect)(program.getComponent('comp1').file.pkgPath).to.equal(comp2.pkgPath);
        });
    });
});
//# sourceMappingURL=XmlFile.spec.js.map