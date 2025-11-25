"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const Program_1 = require("../../Program");
const util_1 = require("../../util");
let rootDir = (0, util_1.standardizePath) `${process.cwd()}/rootDir`;
const sinon_1 = require("sinon");
const DefinitionProvider_1 = require("./DefinitionProvider");
const vscode_uri_1 = require("vscode-uri");
const sinon = (0, sinon_1.createSandbox)();
describe('DefinitionProvider', () => {
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
    it('handles unknown file type', () => {
        const result = new DefinitionProvider_1.DefinitionProvider({
            program: program,
            file: undefined,
            position: util_1.util.createPosition(1, 2),
            definitions: []
        }).process();
        (0, chai_config_spec_1.expect)(result).to.eql([]);
    });
    it('handles callfuncs', () => {
        const customButtonXml = program.setFile('components/CustomButton.xml', `
            <component name="CustomButton" extends="Group">
                <script uri="CustomButton.brs" />
                <interface>
                    <function name="clickCustomButton" />
                </interface>
            </component>
        `);
        const customButtonBrs = program.setFile('components/CustomButton.brs', `
            function clickCustomButton()
            end function
        `);
        const brsFile = program.setFile('source/main.brs', `
            sub main()
                m.customButton@.clickCustomButton()
            end sub
        `);
        //   m.customButton@.click|CustomButon()
        (0, chai_config_spec_1.expect)(program.getDefinition(brsFile.srcPath, util_1.util.createPosition(2, 37))).to.eql([{
                uri: vscode_uri_1.URI.file(customButtonXml.srcPath).toString(),
                range: util_1.util.createRange(4, 21, 4, 57)
            }, {
                uri: vscode_uri_1.URI.file(customButtonBrs.srcPath).toString(),
                range: util_1.util.createRange(1, 21, 1, 38)
            }]);
    });
    it('handles callfuncs for xml file having no interface', () => {
        program.setFile('components/CustomButton.xml', `
            <component name="CustomButton" extends="Group">
            </component>
        `);
        const main = program.setFile('source/main.brs', `
            sub main()
                m.customButton@.clickCustomButton()
            end sub
        `);
        //   m.customButton@.click|CustomButon()
        (0, chai_config_spec_1.expect)(program.getDefinition(main.srcPath, util_1.util.createPosition(2, 37))).to.eql([]);
    });
    it('handles goto', () => {
        const main = program.setFile('source/main.brs', `
            sub main()
                label1:
                print "label1"
                goto label1
            end sub
        `);
        // goto lab|el1
        (0, chai_config_spec_1.expect)(program.getDefinition(main.srcPath, util_1.util.createPosition(4, 24))).to.eql([{
                uri: vscode_uri_1.URI.file(main.srcPath).toString(),
                range: util_1.util.createRange(2, 16, 2, 22)
            }]);
    });
});
//# sourceMappingURL=DefinitionProvider.spec.js.map