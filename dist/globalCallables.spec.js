"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const Program_1 = require("./Program");
const testHelpers_spec_1 = require("./testHelpers.spec");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
const chai_config_spec_1 = require("./chai-config.spec");
describe('globalCallables', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: testHelpers_spec_1.rootDir,
            stagingDir: testHelpers_spec_1.stagingDir
        });
    });
    afterEach(() => {
        program.dispose();
    });
    describe('Roku_ads', () => {
        it('exists', () => {
            program.setFile('source/main.brs', `
                sub main()
                    adIface = Roku_Ads()
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    it('isOptional defaults to false', () => {
        program.setFile('source/main.brs', `
            sub main()
                thing = createObject()
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectDiagnostics)(program, [
            DiagnosticMessages_1.DiagnosticMessages.mismatchArgumentCount('1-6', 0)
        ]);
    });
    it('handles optional params properly', () => {
        program.setFile('source/main.brs', `
            sub main()
                print Mid("value1", 1) 'third param is optional
            end sub
        `);
        program.validate();
        (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
    });
    it('hover shows correct for optional params', () => {
        const file = program.setFile('source/main.brs', `
            sub main()
                print Mid("value1", 1)
            end sub
        `);
        program.validate();
        const hover = program.getHover(file.srcPath, util_1.util.createPosition(2, 25));
        (0, chai_config_spec_1.expect)(hover[0].contents.toString().replace('\r\n', '\n')).to.eql([
            '```brightscript',
            'function Mid(s as string, p as integer, n? as integer) as string',
            '```'
        ].join('\n'));
    });
    describe('bslCore', () => {
        it('exists', () => {
            program.setFile('source/main.brs', `
                Library "v30/bslCore.brs"

                sub main()
                    print bslBrightScriptErrorCodes()
                    print bslUniversalControlEventCodes()
                    print HexToAscii(AsciiToHex("Hi"))
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('val', () => {
        it('allows single parameter', () => {
            program.setFile('source/main.brs', `
                sub main()
                    print val("1001")
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('allows both parameters', () => {
            program.setFile('source/main.brs', `
                sub main()
                    print val("1001", 10)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('StrI', () => {
        it('allows single parameter', () => {
            program.setFile('source/main.brs', `
                sub main()
                    print StrI(2)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('allows both parameters', () => {
            program.setFile('source/main.brs', `
                sub main()
                    print StrI(2, 10)
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
    describe('parseJson', () => {
        it('allows single parameter', () => {
            program.setFile('source/main.brs', `
                sub main()
                    print ParseJson("{}")
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
        it('allows 2 parameters', () => {
            program.setFile('source/main.brs', `
                sub main()
                print ParseJson("{}", "i")
                end sub
            `);
            program.validate();
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        });
    });
});
//# sourceMappingURL=globalCallables.spec.js.map