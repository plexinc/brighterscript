"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const Program_1 = require("./Program");
const testHelpers_spec_1 = require("./testHelpers.spec");
const util_1 = require("./util");
let rootDir = (0, util_1.standardizePath) `${process.cwd()}/rootDir`;
const sinon_1 = require("sinon");
const sinon = (0, sinon_1.createSandbox)();
describe('XmlScope', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: rootDir
        });
        sinon.restore();
    });
    afterEach(() => {
        program.dispose();
        sinon.restore();
    });
    describe('constructor', () => {
        it('listens for attach/detach parent events', () => {
            let parentXmlFile = program.setFile('components/parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Parent" extends="Scene">
                </component>
            `);
            let scope = program.getScopeByName(parentXmlFile.pkgPath);
            //should default to global scope
            (0, chai_config_spec_1.expect)(scope.getParentScope()).to.equal(program.globalScope);
            let childXmlFile = program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Child" extends="Parent">
                </component>
            `);
            let childScope = program.getComponentScope('Child');
            program.validate();
            // child should have found its parent
            (0, chai_config_spec_1.expect)(childXmlFile.parentComponent).to.equal(parentXmlFile);
            // child's parent scope should have found the parent scope
            (0, chai_config_spec_1.expect)(childScope.getParentScope()).to.equal(program.getComponentScope('Parent'));
            //remove the parent component
            program.removeFile(`${rootDir}/components/parent.xml`);
            program.validate();
            //the child should know the parent no longer exists
            (0, chai_config_spec_1.expect)(childXmlFile.parentComponent).not.to.exist;
            //child's parent scope should be the global scope
            (0, chai_config_spec_1.expect)(childScope.getParentScope()).to.equal(program.globalScope);
        });
    });
    describe('getDefinition', () => {
        it('finds parent file', () => {
            let parentXmlFile = program.setFile('components/parent.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ParentComponent">
                </component>
            `);
            let childXmlFile = program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="ChildComponent" extends="ParentComponent">
                </component>
            `);
            const definition = program.getDefinition(childXmlFile.srcPath, vscode_languageserver_1.Position.create(1, 48));
            (0, chai_config_spec_1.expect)(definition).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(definition[0].uri).to.equal(util_1.util.pathToUri(parentXmlFile.srcPath));
        });
    });
    describe('getFiles', () => {
        it('includes the xml file', () => {
            let xmlFile = program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="Child">
                </component>
            `);
            program.validate();
            (0, chai_config_spec_1.expect)(program.getComponentScope('Child').getOwnFiles()[0]).to.equal(xmlFile);
        });
    });
    describe('validate', () => {
        it('adds an error when an interface function cannot be found', () => {
            program = new Program_1.Program({ rootDir: rootDir });
            program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="child" extends="parent">
                    <interface>
                        <function name="func1" />
                        <function name="func2" />
                        <function id="func3" />
                        <function name="" />
                        <function name />
                        <field id="field1" type="string" onChange="func4" />
                    </interface>
                    <script uri="child.brs"/>
                </component>
            `);
            program.setFile((0, util_1.standardizePath) `components/child.brs`, `
                sub func1()
                end sub
            `);
            program.validate();
            let childScope = program.getComponentScope('child');
            (0, testHelpers_spec_1.expectDiagnostics)(childScope, [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlFunctionNotFound('func2')), { range: vscode_languageserver_1.Range.create(4, 24, 4, 29) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('function', 'name')), { range: vscode_languageserver_1.Range.create(5, 9, 5, 17) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('function', 'name')), { range: vscode_languageserver_1.Range.create(6, 9, 6, 17) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('function', 'name')), { range: vscode_languageserver_1.Range.create(7, 9, 7, 17) }), {
                    code: DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('').code
                }, Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlFunctionNotFound('func4')), { range: vscode_languageserver_1.Range.create(8, 51, 8, 56) })]);
        });
        it('adds an error when an interface field is invalid', () => {
            program = new Program_1.Program({ rootDir: rootDir });
            program.setFile('components/child.xml', (0, testHelpers_spec_1.trim) `
                <?xml version="1.0" encoding="utf-8" ?>
                <component name="child" extends="parent">
                    <interface>
                        <field id="field1" type="node" />
                        <field id="field2" type="no" />
                        <field id="field3" />
                        <field name="field4" type="str" />
                        <field id="field5" alias="other.field" />
                        <field id="" type="int" />
                        <field id />
                    </interface>
                    <script uri="child.brs"/>
                </component>
            `);
            program.setFile((0, util_1.standardizePath) `components/child.brs`, `
                sub init()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectDiagnostics)(program.getComponentScope('child'), [Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlInvalidFieldType('no')), { range: vscode_languageserver_1.Range.create(4, 33, 4, 35) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('field', 'type')), { range: vscode_languageserver_1.Range.create(5, 9, 5, 14) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('field', 'id')), { range: vscode_languageserver_1.Range.create(6, 9, 6, 14) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('field', 'id')), { range: vscode_languageserver_1.Range.create(8, 9, 8, 14) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('field', 'id')), { range: vscode_languageserver_1.Range.create(9, 9, 9, 14) }), Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlTagMissingAttribute('field', 'type')), { range: vscode_languageserver_1.Range.create(9, 9, 9, 14) }), {
                    code: DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('').code
                }]);
        });
    });
});
//# sourceMappingURL=XmlScope.spec.js.map