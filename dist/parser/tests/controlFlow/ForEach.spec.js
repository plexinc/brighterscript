"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const TokenKind_1 = require("../../../lexer/TokenKind");
const Parser_spec_1 = require("../Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const Statement_1 = require("../../Statement");
const Expression_1 = require("../../Expression");
describe('parser foreach loops', () => {
    it('requires a name and target', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.ForEach, 'for each'),
            (0, Parser_spec_1.identifier)('word'),
            (0, Parser_spec_1.identifier)('in'),
            (0, Parser_spec_1.identifier)('lipsum'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            // body would go here, but it's not necessary for this test
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.EndFor, 'end for'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        let forEach = statements[0];
        (0, chai_config_spec_1.expect)(forEach).to.be.instanceof(Statement_1.ForEachStatement);
        (0, chai_config_spec_1.expect)(forEach.item).to.deep.include((0, Parser_spec_1.identifier)('word'));
        (0, chai_config_spec_1.expect)(forEach.target).to.be.instanceof(Expression_1.VariableExpression);
        (0, chai_config_spec_1.expect)(forEach.target.name).to.deep.include((0, Parser_spec_1.identifier)('lipsum'));
    });
    it('allows \'next\' to terminate loop', () => {
        let { statements, diagnostics } = Parser_1.Parser.parse([
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.ForEach, 'for each'),
            (0, Parser_spec_1.identifier)('word'),
            (0, Parser_spec_1.identifier)('in'),
            (0, Parser_spec_1.identifier)('lipsum'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            // body would go here, but it's not necessary for this test
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Next, 'next'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.exist;
        (0, chai_config_spec_1.expect)(statements).to.be.length.greaterThan(0);
    });
    it('location tracking', () => {
        /**
         *    0   0   0   1   1
         *    0   4   8   2   6
         *  +------------------
         * 0| for each a in b
         * 1|   Rnd(a)
         * 2| end for
         */
        let { statements, diagnostics } = Parser_1.Parser.parse([
            {
                kind: TokenKind_1.TokenKind.ForEach,
                text: 'for each',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 0, 0, 8)
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'a',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 9, 0, 10)
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'in',
                isReserved: true,
                range: vscode_languageserver_1.Range.create(0, 11, 0, 13)
            },
            {
                kind: TokenKind_1.TokenKind.Identifier,
                text: 'b',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 14, 0, 15)
            },
            {
                kind: TokenKind_1.TokenKind.Newline,
                text: '\n',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(0, 15, 0, 16)
            },
            // loop body isn't significant for location tracking, so helper functions are safe
            (0, Parser_spec_1.identifier)('Rnd'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.identifier)('a'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            {
                kind: TokenKind_1.TokenKind.EndFor,
                text: 'end for',
                isReserved: false,
                range: vscode_languageserver_1.Range.create(2, 0, 2, 7)
            },
            Parser_spec_1.EOF
        ]);
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(0);
        (0, chai_config_spec_1.expect)(statements).to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(statements[0].range).deep.include(vscode_languageserver_1.Range.create(0, 0, 2, 7));
    });
});
//# sourceMappingURL=ForEach.spec.js.map