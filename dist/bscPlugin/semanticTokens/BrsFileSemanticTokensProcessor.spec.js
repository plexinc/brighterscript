"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const Program_1 = require("../../Program");
const testHelpers_spec_1 = require("../../testHelpers.spec");
const util_1 = require("../../util");
const testHelpers_spec_2 = require("../../testHelpers.spec");
describe('BrsFileSemanticTokensProcessor', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir
        });
    });
    afterEach(() => {
        program.dispose();
    });
    function expectSemanticTokens(file, tokens, validateDiagnostics = true) {
        var _a;
        program.validate();
        if (validateDiagnostics) {
            (0, testHelpers_spec_1.expectZeroDiagnostics)(program);
        }
        const result = util_1.util.sortByRange(program.getSemanticTokens(file.srcPath));
        //sort modifiers
        for (const collection of [result, tokens]) {
            for (const token of collection) {
                (_a = token.tokenModifiers) !== null && _a !== void 0 ? _a : (token.tokenModifiers = []);
                token.tokenModifiers.sort();
            }
        }
        (0, chai_config_spec_1.expect)(result).to.eql(util_1.util.sortByRange(tokens));
        return result;
    }
    it('matches each namespace section for class', () => {
        const file = program.setFile('source/main.bs', `
            class Host
                sub new()
                    m.alien = new Humanoids.Aliens.Alien()
                end sub
            end class

            namespace Humanoids.Aliens
                class Alien
                end class
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(3, 34, 3, 43),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(3, 44, 3, 50),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(3, 51, 3, 56),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.class
            }]);
    });
    it('matches each namespace section for namespaced function calls', () => {
        const file = program.setFile('source/main.bs', `
            sub new()
                Humanoids.Aliens.Invade("earth")
            end sub
            namespace Humanoids.Aliens
                function Invade(planet)
                end function
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 16, 2, 25),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 26, 2, 32),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 33, 2, 39),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.function
            }]);
    });
    it('matches namespace-relative parts', () => {
        const file = program.setFile('source/main.bs', `
            namespace alpha
                sub test()
                    lineHeight = 1
                    print lineHeight
                end sub
            end namespace
            namespace alpha.lineHeight
            end namespace
        `);
        expectSemanticTokens(file, [{
                //|lineHeight| = 1
                range: util_1.util.createRange(3, 20, 3, 30),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                //print |lineHeight|
                range: util_1.util.createRange(4, 26, 4, 36),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }], false);
    });
    it('matches namespace-relative parts in parameters', () => {
        const file = program.setFile('source/main.bs', `
            namespace alpha
                sub test(lineHeight as integer)
                end sub
            end namespace
            namespace alpha.lineHeight
            end namespace
        `);
        expectSemanticTokens(file, [{
                //sub test(|lineHeight| as integer)
                range: util_1.util.createRange(2, 25, 2, 35),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }], false);
    });
    it('matches namespace-relative parts in parameters', () => {
        const file = program.setFile('source/main.bs', `
            namespace designSystem
                function getIcon(image = "" as string, size = -1 as float) as object
                    return {}
                end function
            end namespace
            namespace designSystem.size
            end namespace
        `);
        expectSemanticTokens(file, [{
                //sub test(|lineHeight| as integer)
                range: util_1.util.createRange(2, 55, 2, 59),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }], false);
    });
    it('matches each namespace section for namespaced function assignment', () => {
        const file = program.setFile('source/main.bs', `
            sub new()
                action = Humanoids.Aliens.Invade
            end sub
            namespace Humanoids.Aliens
                function Invade(planet)
                end function
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 25, 2, 34),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 35, 2, 41),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 42, 2, 48),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.function
            }]);
    });
    it('matches each namespace section for namespaced function as function parameter', () => {
        const file = program.setFile('source/main.bs', `
            sub new()
                actionName = type(Humanoids.Aliens.Invade)
            end sub
            namespace Humanoids.Aliens
                function Invade(planet)
                end function
            end namespace
        `);
        expectSemanticTokens(file, [{
                //`type` function call
                range: util_1.util.createRange(2, 29, 2, 33),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.function
            }, {
                range: util_1.util.createRange(2, 34, 2, 43),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 44, 2, 50),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 51, 2, 57),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.function
            }]);
    });
    it('matches each namespace section for namespaced function in print statement', () => {
        const file = program.setFile('source/main.bs', `
            sub new()
                print Humanoids.Aliens.Invade
            end sub
            namespace Humanoids.Aliens
                function Invade(planet)
                end function
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 22, 2, 31),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 32, 2, 38),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 39, 2, 45),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.function
            }]);
    });
    it('matches each namespace section for enums', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                print Earthlings.Species.Human.Male
            end sub
            namespace Earthlings.Species
                enum Human
                    Male
                    Female
                end enum
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 22, 2, 32),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 33, 2, 40),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 41, 2, 46),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enum
            }, {
                range: util_1.util.createRange(2, 47, 2, 51),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enumMember
            }]);
    });
    it('matches each namespace section for enum', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                print Sentients.Humanoids.HumanoidType.Cylon
            end sub
            namespace Sentients.Humanoids
                enum HumanoidType
                    Human
                    Alien
                    Cylon
                end enum
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 22, 2, 31),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 32, 2, 41),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 42, 2, 54),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enum
            }, {
                range: util_1.util.createRange(2, 55, 2, 60),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enumMember
            }]);
    });
    it('matches enums in if statements', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                if Humanoids.HumanoidType.Cylon = "Cylon" then
                    print true
                end if
            end sub
            namespace Humanoids
                enum HumanoidType
                    Human = "Human"
                    Alien = "Alien"
                    Cylon = "Cylon"
                end enum
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 19, 2, 28),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 29, 2, 41),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enum
            }, {
                range: util_1.util.createRange(2, 42, 2, 47),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enumMember
            }]);
    });
    it('matches enum with invalid member name', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                print Humanoids.HumanoidType.INVALID_VALUE 'bs:disable-line
            end sub
            namespace Humanoids
                enum HumanoidType
                    Human = "Human"
                    Alien = "Alien"
                    Cylon = "Cylon"
                end enum
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 22, 2, 31),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 32, 2, 44),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.enum
            }]);
    });
    it('matches class with invalid stuff after it', () => {
        const file = program.setFile('source/main.bs', `
            sub init()
                m.alien = new Humanoids.Aliens.Alien.NOT_A_CLASS() 'bs:disable-line
            end sub

            namespace Humanoids.Aliens
                class Alien
                end class
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 30, 2, 39),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 40, 2, 46),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(2, 47, 2, 52),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.class
            }]);
    });
    it('matches consts', () => {
        const file = program.setFile('source/main.bs', `
            sub init()
                print API_URL
                print info.FIRST_NAME
            end sub
            const API_URL = "some_url"
            namespace info
                const FIRST_NAME = "bob"
            end namespace
        `);
        expectSemanticTokens(file, [{
                range: util_1.util.createRange(2, 22, 2, 29),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            }, {
                range: util_1.util.createRange(3, 22, 3, 26),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            }, {
                range: util_1.util.createRange(3, 27, 3, 37),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            }, {
                range: util_1.util.createRange(5, 18, 5, 25),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            }, {
                range: util_1.util.createRange(7, 22, 7, 32),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            }]);
    });
    it('matches consts in assignment expressions', () => {
        const file = program.setFile('source/main.bs', `
            sub main()
                value = ""
                value += constants.API_KEY
                value += API_URL
            end sub
            namespace constants
                const API_KEY = "test"
            end namespace
            const API_URL = "url"
        `);
        expectSemanticTokens(file, [
            // value += |constants|.API_KEY
            {
                range: util_1.util.createRange(3, 25, 3, 34),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.namespace
            },
            // value += constants.|API_KEY|
            {
                range: util_1.util.createRange(3, 35, 3, 42),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            },
            // value += |API_URL|
            {
                range: util_1.util.createRange(4, 25, 4, 32),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            },
            // const |API_KEY| = "test"
            {
                range: util_1.util.createRange(7, 22, 7, 29),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            },
            //const |API_URL| = "url"
            {
                range: util_1.util.createRange(9, 18, 9, 25),
                tokenType: vscode_languageserver_protocol_1.SemanticTokenTypes.variable,
                tokenModifiers: [vscode_languageserver_protocol_1.SemanticTokenModifiers.readonly, vscode_languageserver_protocol_1.SemanticTokenModifiers.static]
            }
        ]);
    });
});
//# sourceMappingURL=BrsFileSemanticTokensProcessor.spec.js.map