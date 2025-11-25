"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Lexer_1 = require("../../../lexer/Lexer");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
describe('parser goto statements', () => {
    it('parses standalone statement properly', () => {
        let { diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Goto, 'goto'),
            (0, Parser_spec_1.identifier)('SomeLabel'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
    });
    it('detects labels', () => {
        let { diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.identifier)('SomeLabel'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Colon, ':'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
    });
    it('allows multiple goto statements on one line', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            sub Main()
                'multiple goto statements on one line
                goto myLabel : goto myLabel
                myLabel:
            end sub
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
    });
    it('ignores "labels" not alone on their line', () => {
        let { tokens } = Lexer_1.Lexer.scan(`
            sub Main()
                label1: 'some comment
                notalabel1: print "ko"
                print "ko": notalabel2:
            end sub
        `);
        let { diagnostics } = Parser_1.Parser.parse(tokens);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(2);
    });
});
//# sourceMappingURL=Goto.spec.js.map