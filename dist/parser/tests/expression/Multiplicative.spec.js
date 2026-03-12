"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
describe('parser', () => {
    describe('multiplicative expressions', () => {
        it('parses left-associative multiplication chains', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '3.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Star, '*'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '5.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Star, '*'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '7.0'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses left-associative division chains', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '7.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Forwardslash, '/'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '5.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Forwardslash, '/'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '3.0'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses left-associative modulo chains', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '7.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Mod, 'MOD'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '5.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Mod, 'MOD'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '3.0'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
        it('parses left-associative integer-division chains', () => {
            let { statements, diagnostics } = Parser_1.Parser.parse([
                (0, Parser_spec_1.identifier)('_'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '32.5'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Backslash, '\\'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '5.0'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Backslash, '\\'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.FloatLiteral, '3.0'),
                Parser_spec_1.EOF
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
            (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
        });
    });
});
//# sourceMappingURL=Multiplicative.spec.js.map