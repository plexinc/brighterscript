"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PreprocessorParser_1 = require("./PreprocessorParser");
const Parser_spec_1 = require("../parser/tests/Parser.spec");
const TokenKind_1 = require("../lexer/TokenKind");
const chai_config_spec_1 = require("../chai-config.spec");
describe('preprocessor parser', () => {
    let parser;
    beforeEach(() => {
        parser = new PreprocessorParser_1.PreprocessorParser();
    });
    it('parses chunks of brightscript', () => {
        let { chunks, diagnostics } = parser.parse([
            (0, Parser_spec_1.identifier)('someFunction'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.eql([]);
        (0, chai_config_spec_1.expect)(chunks[0].tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Identifier,
            TokenKind_1.TokenKind.LeftParen,
            TokenKind_1.TokenKind.RightParen,
            TokenKind_1.TokenKind.Newline
        ]);
    });
    it('parses #const', () => {
        let { chunks, diagnostics } = parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashConst, '#const'),
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Equal, '='),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.empty;
        (0, chai_config_spec_1.expect)(chunks).to.exist;
    });
    it('parses #error', () => {
        let { chunks, diagnostics } = parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashError, '#error'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashErrorMessage, 'I\'m an error message!'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.eql([]);
        (0, chai_config_spec_1.expect)(chunks).to.exist;
    });
    describe('conditionals', () => {
        it('#if only', () => {
            let { chunks, diagnostics } = parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashIf, '#if'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('fooIsTrue'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashEndIf, '#endif'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.eql([]);
            (0, chai_config_spec_1.expect)(chunks).to.exist;
        });
        it('#if and #else', () => {
            let { chunks, diagnostics } = parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashIf, '#if'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('fooIsTrue'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashElse, '#else'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('fooIsFalse'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashEndIf, '#endif'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.eql([]);
            (0, chai_config_spec_1.expect)(chunks).to.exist;
        });
        it('#if #else if and #else', () => {
            let { chunks, diagnostics } = parser.parse([
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashIf, '#if'),
                (0, Parser_spec_1.identifier)('foo'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('fooIsTrue'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashElseIf, '#elseif'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('bar'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashElse, '#else'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.identifier)('neither'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashEndIf, '#endif'),
                (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Eof, '\0')
            ]);
            (0, chai_config_spec_1.expect)(diagnostics).to.eql([]);
            (0, chai_config_spec_1.expect)(chunks).to.exist;
        });
    });
});
//# sourceMappingURL=PreprocessorParser.spec.js.map