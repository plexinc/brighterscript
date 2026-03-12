"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const sinonImport = require("sinon");
const fsExtra = require("fs-extra");
const DiagnosticMessages_1 = require("../../DiagnosticMessages");
const Program_1 = require("../../Program");
const util_1 = require("../../util");
const testHelpers_spec_1 = require("../../testHelpers.spec");
const testHelpers_spec_2 = require("../../testHelpers.spec");
let sinon = sinonImport.createSandbox();
describe('import statements', () => {
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
    it('still transpiles import statements if found at bottom of file', async () => {
        program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="Scene">
                <script type="text/brighterscript" uri="pkg:/source/lib.bs" />
            </component>
        `);
        program.setFile('source/lib.bs', `
            function toLower(strVal as string)
                return StringToLower(strVal)
            end function
            'this import is purposefully at the bottom just to prove the transpile still works
            import "stringOps.bs"
        `);
        program.setFile('source/stringOps.bs', `
            function StringToLower(strVal as string)
                return true
            end function
        `);
        let files = Object.keys(program.files).map(x => program.getFile(x)).filter(x => !!x).map(x => {
            return {
                src: x.srcPath,
                dest: x.pkgPath
            };
        });
        await program.transpile(files, testHelpers_spec_2.stagingDir);
        (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(fsExtra.readFileSync(`${testHelpers_spec_2.stagingDir}/components/ChildScene.xml`).toString())).to.equal((0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="Scene">
                <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                <script type="text/brightscript" uri="pkg:/source/stringOps.brs" />
                <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
            </component>
        `);
    });
    it('finds function loaded in by import multiple levels deep', () => {
        //create child component
        let component = program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brighterscript" uri="pkg:/source/lib.bs" />
            </component>
        `);
        program.setFile('source/lib.bs', `
            import "stringOps.bs"
            function toLower(strVal as string)
                return StringToLower(strVal)
            end function
        `);
        program.setFile('source/stringOps.bs', `
            import "intOps.bs"
            function StringToLower(strVal as string)
                return isInt(strVal)
            end function
        `);
        program.setFile('source/intOps.bs', `
            function isInt(strVal as dynamic)
                return true
            end function
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        (0, chai_config_spec_1.expect)(component.getAvailableScriptImports().sort()).to.eql([
            (0, util_1.standardizePath) `source/intOps.bs`,
            (0, util_1.standardizePath) `source/lib.bs`,
            (0, util_1.standardizePath) `source/stringOps.bs`
        ]);
    });
    it('supports importing brs files', () => {
        //create child component
        let component = program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brighterscript" uri="pkg:/source/lib.bs" />
            </component>
        `);
        program.setFile('source/lib.bs', `
            import "stringOps.brs"
            function toLower(strVal as string)
                return StringToLower(strVal)
            end function
        `);
        program.setFile('source/stringOps.brs', `
            function StringToLower(strVal as string)
                return lcase(strVal)
            end function
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        (0, chai_config_spec_1.expect)(component.getAvailableScriptImports()).to.eql([
            (0, util_1.standardizePath) `source/lib.bs`,
            (0, util_1.standardizePath) `source/stringOps.brs`
        ]);
    });
    it('detects when dependency contents have changed', () => {
        //create child component
        program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brighterscript" uri="lib.bs" />
            </component>
        `);
        program.setFile('components/lib.bs', `
            import "animalActions.bs"
            function init1(strVal as string)
                Waddle()
            end function
        `);
        //add the empty dependency
        program.setFile('components/animalActions.bs', ``);
        //there should be an error because that function doesn't exist
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.cannotFindFunction('Waddle')
        ]);
        //add the missing function
        program.setFile('components/animalActions.bs', `
            sub Waddle()
                print "Waddling"
            end sub
        `);
        //validate again
        program.validate();
        //the error should be gone
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    it('adds brs imports to xml file during transpile', () => {
        //create child component
        let component = program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brightscript" uri="pkg:/source/lib.bs" />
            </component>
        `);
        program.setFile('source/lib.bs', `
            import "stringOps.brs"
            function toLower(strVal as string)
                return StringToLower(strVal)
            end function
        `);
        program.setFile('source/stringOps.brs', `
            function StringToLower(strVal as string)
                return isInt(strVal)
            end function
        `);
        program.validate();
        (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.trimMap)(component.transpile().code)).to.equal((0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brightscript" uri="pkg:/source/lib.brs" />
                <script type="text/brightscript" uri="pkg:/source/stringOps.brs" />
                <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
            </component>
        `);
    });
    it('shows diagnostic for missing file in import', () => {
        //create child component
        program.setFile('components/ChildScene.xml', (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brighterscript" uri="ChildScene.bs" />
            </component>
        `);
        program.setFile('components/ChildScene.bs', `
            import "stringOps.bs"
            sub init()
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.referencedFileDoesNotExist()
        ]);
    });
    it('complicated import graph adds correct script tags', () => {
        program.setFile('source/maestro/ioc/IOCMixin.bs', `
            sub DoIocThings()
            end sub
        `);
        program.setFile('source/BaseClass.bs', `
            import "pkg:/source/maestro/ioc/IOCMixin.bs"
        `);
        program.setFile('components/AuthManager.bs', `
            import "pkg:/source/BaseClass.bs"
        `);
        testTranspile((0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brighterscript" uri="AuthManager.bs" />
            </component>
        `, (0, testHelpers_spec_1.trim) `
            <?xml version="1.0" encoding="utf-8" ?>
            <component name="ChildScene" extends="ParentScene">
                <script type="text/brightscript" uri="AuthManager.brs" />
                <script type="text/brightscript" uri="pkg:/source/BaseClass.brs" />
                <script type="text/brightscript" uri="pkg:/source/maestro/ioc/IOCMixin.brs" />
                <script type="text/brightscript" uri="pkg:/source/bslib.brs" />
            </component>
        `, null, 'components/AuthenticationService.xml');
    });
    it('handles malformed imports', () => {
        //shouldn't crash
        const brsFile = program.setFile('source/SomeFile.bs', `
            import ""
            import ":"
            import ":/"
            import "pkg:"
            import "pkg:/"
        `);
        (0, chai_config_spec_1.expect)(brsFile.ownScriptImports.length).to.equal(5);
        (0, chai_config_spec_1.expect)(brsFile.ownScriptImports.filter(p => !!p.pkgPath).length).to.equal(3);
    });
});
//# sourceMappingURL=imports.spec.js.map