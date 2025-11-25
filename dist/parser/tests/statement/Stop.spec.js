"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
describe('stop statement', () => {
    it('cannot be used as a local variable', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Stop, 'stop'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            Parser_spec_1.EOF
        ]);
        //should be an error
        (0, chai_config_spec_1.expect)(diagnostics).to.be.length.greaterThan(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).not.to.be.null;
    });
    it('is valid as a statement', () => {
        let { diagnostics } = Parser_1.Parser.parse([(0, Parser_spec_1.token)(TokenKind_1.TokenKind.Stop, 'stop'), Parser_spec_1.EOF]);
        (0, chai_config_spec_1.expect)(diagnostics[0]).to.be.undefined;
    });
    it('can be used as an object property', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            sub Main()
                theObject = {
                    stop: false
                }
                theObject.stop = true
            end sub
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics.length).to.equal(0);
    });
    it('supports @stop', () => {
        let { diagnostics } = Parser_1.Parser.parse([(0, Parser_spec_1.token)(TokenKind_1.TokenKind.AtStop, '@stop'), Parser_spec_1.EOF]);
        (0, chai_config_spec_1.expect)(diagnostics[0]).to.be.undefined;
    });
    it('supports @STOP', () => {
        let { diagnostics } = Parser_1.Parser.parse([(0, Parser_spec_1.token)(TokenKind_1.TokenKind.AtStop, '@STOP'), Parser_spec_1.EOF]);
        (0, chai_config_spec_1.expect)(diagnostics[0]).to.be.undefined;
    });
    it('lexer recognizes @stop', () => {
        let { tokens } = Lexer_1.Lexer.scan('@stop');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.AtStop);
    });
    it('lexer recognizes @STOP', () => {
        let { tokens } = Lexer_1.Lexer.scan('@STOP');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.AtStop);
    });
});
//# sourceMappingURL=Stop.spec.js.map