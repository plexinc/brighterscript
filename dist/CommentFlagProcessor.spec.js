"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const CommentFlagProcessor_1 = require("./CommentFlagProcessor");
const Lexer_1 = require("./lexer/Lexer");
describe('CommentFlagProcessor', () => {
    let processor;
    const mockBscFile = null;
    describe('tokenizeByWhitespace', () => {
        beforeEach(() => {
            processor = new CommentFlagProcessor_1.CommentFlagProcessor(mockBscFile);
        });
        it('works with single chars', () => {
            (0, chai_config_spec_1.expect)(processor['tokenizeByWhitespace']('a b c')).to.deep.equal([{
                    startIndex: 0,
                    text: 'a'
                }, {
                    startIndex: 2,
                    text: 'b'
                },
                {
                    startIndex: 4,
                    text: 'c'
                }]);
        });
        it('works with tabs', () => {
            (0, chai_config_spec_1.expect)(processor['tokenizeByWhitespace']('a\tb\t c')).to.deep.equal([{
                    startIndex: 0,
                    text: 'a'
                }, {
                    startIndex: 2,
                    text: 'b'
                },
                {
                    startIndex: 5,
                    text: 'c'
                }]);
            it('works with leading whitespace', () => {
                (0, chai_config_spec_1.expect)(processor['tokenizeByWhitespace']('  \ta\tb\t c')).to.deep.equal([{
                        startIndex: 4,
                        text: 'a'
                    }, {
                        startIndex: 6,
                        text: 'b'
                    },
                    {
                        startIndex: 9,
                        text: 'c'
                    }]);
            });
            it('works with multiple characters in a word', () => {
                (0, chai_config_spec_1.expect)(processor['tokenizeByWhitespace']('abc 123')).to.deep.equal([{
                        startIndex: 0,
                        text: 'abc'
                    }, {
                        startIndex: 4,
                        text: '123'
                    }]);
            });
        });
    });
    describe('tokenize', () => {
        beforeEach(() => {
            processor = new CommentFlagProcessor_1.CommentFlagProcessor(mockBscFile, [`'`]);
        });
        it('skips non disable comments', () => {
            (0, chai_config_spec_1.expect)(processor['tokenize'](`'not disable comment`, null)).not.to.exist;
        });
        it('tokenizes bs:disable-line comment', () => {
            (0, chai_config_spec_1.expect)(processor['tokenize'](`'bs:disable-line`, null)).to.eql({
                commentTokenText: `'`,
                disableType: 'line',
                codes: []
            });
        });
        it('works for special case', () => {
            const token = Lexer_1.Lexer.scan(`print "hi" 'bs:disable-line: 123456 999999   aaaab`).tokens[2];
            (0, chai_config_spec_1.expect)(processor['tokenize'](token.text, token.range)).to.eql({
                commentTokenText: `'`,
                disableType: 'line',
                codes: [{
                        code: '123456',
                        range: vscode_languageserver_1.Range.create(0, 29, 0, 35)
                    }, {
                        code: '999999',
                        range: vscode_languageserver_1.Range.create(0, 36, 0, 42)
                    }, {
                        code: 'aaaab',
                        range: vscode_languageserver_1.Range.create(0, 45, 0, 50)
                    }]
            });
        });
        it('tokenizes bs:disable-line comment with codes', () => {
            const token = Lexer_1.Lexer.scan(`'bs:disable-line:1 2 3`).tokens[0];
            (0, chai_config_spec_1.expect)(processor['tokenize'](token.text, token.range)).to.eql({
                commentTokenText: `'`,
                disableType: 'line',
                codes: [{
                        code: '1',
                        range: vscode_languageserver_1.Range.create(0, 17, 0, 18)
                    }, {
                        code: '2',
                        range: vscode_languageserver_1.Range.create(0, 19, 0, 20)
                    }, {
                        code: '3',
                        range: vscode_languageserver_1.Range.create(0, 21, 0, 22)
                    }]
            });
        });
        it('tokenizes bs:disable-line comment with leading space', () => {
            const token = Lexer_1.Lexer.scan(`' bs:disable-line:1`).tokens[0];
            (0, chai_config_spec_1.expect)(processor['tokenize'](token.text, token.range)).to.eql({
                commentTokenText: `'`,
                disableType: 'line',
                codes: [{
                        code: '1',
                        range: vscode_languageserver_1.Range.create(0, 18, 0, 19)
                    }]
            });
        });
        it('tokenizes bs:disable-line comment with leading tab', () => {
            const token = Lexer_1.Lexer.scan(`'\tbs:disable-line:1`).tokens[0];
            (0, chai_config_spec_1.expect)(processor['tokenize'](token.text, token.range)).to.eql({
                commentTokenText: `'`,
                disableType: 'line',
                codes: [{
                        code: '1',
                        range: vscode_languageserver_1.Range.create(0, 18, 0, 19)
                    }]
            });
        });
    });
    describe('tryAdd', () => {
        it('supports non-numeric codes', () => {
            processor.tryAdd(`'bs:disable-line lint123 LINT2 some-textual-diagnostic`, vscode_languageserver_1.Range.create(0, 0, 0, 54));
            (0, chai_config_spec_1.expect)(processor.commentFlags.flatMap(x => x.codes)).to.eql([
                'lint123',
                'lint2',
                'some-textual-diagnostic'
            ]);
        });
    });
});
//# sourceMappingURL=CommentFlagProcessor.spec.js.map