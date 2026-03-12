"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
describe('parser assignment operators', () => {
    it('+=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.PlusEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StringLiteral, `"lorem"`),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('-=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.MinusEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '1'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('*=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.StarEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '3'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('/=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.ForwardslashEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '4'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('\\=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.BackslashEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '5'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('<<=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftShiftEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '6'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
    it('>>=', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.identifier)('_'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightShiftEqual),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.IntegerLiteral, '7'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
    });
});
//# sourceMappingURL=AssignmentOperators.spec.js.map