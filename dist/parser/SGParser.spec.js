"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const DiagnosticMessages_1 = require("../DiagnosticMessages");
const testHelpers_spec_1 = require("../testHelpers.spec");
const SGParser_1 = require("./SGParser");
const sinon_1 = require("sinon");
const Program_1 = require("../Program");
const testHelpers_spec_2 = require("../testHelpers.spec");
let sinon = (0, sinon_1.createSandbox)();
describe('SGParser', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({ rootDir: testHelpers_spec_2.rootDir, sourceMap: false });
    });
    afterEach(() => {
        sinon.restore();
        program.dispose();
    });
    it('Parses well formed SG component', () => {
        const file = program.setFile('components/file.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ParentScene" extends="GrandparentScene">
                <interface>
                    <field id="content" type="string" alwaysNotify="true" />
                    <function name="load" />
                </interface>
                <!-- some XML comment -->
                <script type="text/brightscript" uri="./Component1.brs" />
                <script type="text/brightscript">
                    <![CDATA[
                        function init()
                            print "hello"
                        end function
                    ]]>
                </script>
                <children>
                    <Label id="loadingIndicator"
                        text="Loading..."
                        font="font:MediumBoldSystemFont"
                        />
                </children>
            </component>`);
        const { ast } = file.parser;
        (0, chai_config_spec_1.expect)(ast.prolog).to.exist;
        (0, chai_config_spec_1.expect)(ast.component).to.exist;
        (0, chai_config_spec_1.expect)(ast.root).to.equal(ast.component);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(file);
        const output = file.transpile();
        (0, chai_config_spec_1.expect)(output.code.trimEnd()).to.equal((0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ParentScene" extends="GrandparentScene">
                <interface>
                    <field id="content" type="string" alwaysNotify="true" />
                    <function name="load" />
                </interface>
                <script type="text/brightscript" uri="./Component1.brs" />
                <script type="text/brightscript"><![CDATA[
                        function init()
                            print "hello"
                        end function
                    ]]></script>
                <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
                <children>
                    <Label id="loadingIndicator" text="Loading..." font="font:MediumBoldSystemFont" />
                </children>
            </component>
        `);
    });
    it('does not crash when missing tag name', () => {
        const parser = new SGParser_1.default();
        parser.parse('pkg:/components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
            <!-- a standalone less-than symbol used to cause issues -->
            <
            </component>
        `);
        //the test passes if the parser doesn't throw a runtime exception.
    });
    it('Adds error when an unexpected tag is found in xml', () => {
        const parser = new SGParser_1.default();
        parser.parse('pkg:/components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <interface>
                    <unexpected />
                </interface>
                <unexpectedToo />
            </component>
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(parser.diagnostics[0]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag('unexpected')), { range: vscode_languageserver_1.Range.create(3, 9, 3, 19) }));
        (0, chai_config_spec_1.expect)(parser.diagnostics[1]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedTag('unexpectedToo')), { range: vscode_languageserver_1.Range.create(5, 5, 5, 18) }));
    });
    it('Adds error when a leaf tag is found to have children', () => {
        const parser = new SGParser_1.default();
        parser.parse('pkg:/components/ParentScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <interface>
                    <field id="prop">
                        <unexpected />
                    </field>
                </interface>
                <script type="text/brightscript" uri="./Component1.brs">
                    <unexpectedToo />
                </script>
            </component>
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(parser.diagnostics[0]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedChildren('field')), { range: vscode_languageserver_1.Range.create(3, 9, 3, 14) }));
        (0, chai_config_spec_1.expect)(parser.diagnostics[1]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlUnexpectedChildren('script')), { range: vscode_languageserver_1.Range.create(7, 5, 7, 11) }));
    });
    it('Adds error when whitespace appears before the prolog', () => {
        const parser = new SGParser_1.default();
        parser.parse('path/to/component/ChildScene.xml', /* not trimmed */ `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brightscript" uri="ChildScene.brs" />
            </component>`);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(2);
        (0, chai_config_spec_1.expect)(parser.diagnostics[0]).to.deep.include({
            code: DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('').code,
            range: vscode_languageserver_1.Range.create(1, 12, 1, 18)
        });
        (0, chai_config_spec_1.expect)(parser.diagnostics[1]).to.deep.include(Object.assign(Object.assign({}, DiagnosticMessages_1.DiagnosticMessages.xmlGenericParseError('Syntax error: whitespace found before the XML prolog')), { range: vscode_languageserver_1.Range.create(0, 0, 1, 12) }));
    });
});
//# sourceMappingURL=SGParser.spec.js.map