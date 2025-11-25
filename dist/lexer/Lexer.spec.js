"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint no-template-curly-in-string: 0 */
const chai_config_spec_1 = require("../chai-config.spec");
const TokenKind_1 = require("./TokenKind");
const Lexer_1 = require("./Lexer");
const Token_1 = require("./Token");
const Parser_spec_1 = require("../parser/Parser.spec");
const vscode_languageserver_1 = require("vscode-languageserver");
const util_1 = require("../util");
describe('lexer', () => {
    it('recognizes the `const` keyword', () => {
        let { tokens } = Lexer_1.Lexer.scan('const');
        (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Const,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('recognizes namespace keywords', () => {
        let { tokens } = Lexer_1.Lexer.scan('namespace end namespace endnamespace end   namespace');
        (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Namespace,
            TokenKind_1.TokenKind.EndNamespace,
            TokenKind_1.TokenKind.EndNamespace,
            TokenKind_1.TokenKind.EndNamespace,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('recognizes the question mark operator in various contexts', () => {
        expectKinds('? ?? ?. ?[ ?.[ ?( ?@', [
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.QuestionQuestion,
            TokenKind_1.TokenKind.QuestionDot,
            TokenKind_1.TokenKind.QuestionLeftSquare,
            TokenKind_1.TokenKind.QuestionDot,
            TokenKind_1.TokenKind.LeftSquareBracket,
            TokenKind_1.TokenKind.QuestionLeftParen,
            TokenKind_1.TokenKind.QuestionAt
        ]);
    });
    it('separates optional chain characters and LeftSquare when found at beginning of statement locations', () => {
        //a statement starting with a question mark is actually a print statement, so we need to keep the ? separate from [
        expectKinds(`?[ ?[ : ?[ ?[`, [
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftSquareBracket,
            TokenKind_1.TokenKind.QuestionLeftSquare,
            TokenKind_1.TokenKind.Colon,
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftSquareBracket,
            TokenKind_1.TokenKind.QuestionLeftSquare
        ]);
    });
    it('separates optional chain characters and LeftParen when found at beginning of statement locations', () => {
        //a statement starting with a question mark is actually a print statement, so we need to keep the ? separate from [
        expectKinds(`?( ?( : ?( ?(`, [
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftParen,
            TokenKind_1.TokenKind.QuestionLeftParen,
            TokenKind_1.TokenKind.Colon,
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftParen,
            TokenKind_1.TokenKind.QuestionLeftParen
        ]);
    });
    it('handles QuestionDot and Square properly', () => {
        expectKinds('?.[ ?. [', [
            TokenKind_1.TokenKind.QuestionDot,
            TokenKind_1.TokenKind.LeftSquareBracket,
            TokenKind_1.TokenKind.QuestionDot,
            TokenKind_1.TokenKind.LeftSquareBracket
        ]);
    });
    it('does not make conditional chaining tokens with space between', () => {
        expectKinds('? . ? [ ? ( ? @', [
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.Dot,
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftSquareBracket,
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.LeftParen,
            TokenKind_1.TokenKind.Question,
            TokenKind_1.TokenKind.At
        ]);
    });
    it('recognizes the callfunc operator', () => {
        let { tokens } = Lexer_1.Lexer.scan('@.');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.Callfunc);
    });
    it('recognizes the import token', () => {
        let { tokens } = Lexer_1.Lexer.scan('import');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.eql(TokenKind_1.TokenKind.Import);
    });
    it('recognizes library token', () => {
        let { tokens } = Lexer_1.Lexer.scan('library');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.eql(TokenKind_1.TokenKind.Library);
    });
    it('produces an at symbol token', () => {
        let { tokens } = Lexer_1.Lexer.scan('@');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.At);
    });
    it('produces a semicolon token', () => {
        let { tokens } = Lexer_1.Lexer.scan(';');
        (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.Semicolon);
    });
    it('emits error on unknown character type', () => {
        let { diagnostics } = Lexer_1.Lexer.scan('\0');
        (0, chai_config_spec_1.expect)(diagnostics).to.be.lengthOf(1);
    });
    it('includes an end-of-file marker', () => {
        let { tokens } = Lexer_1.Lexer.scan('');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Eof]);
    });
    it('ignores tabs and spaces', () => {
        let { tokens } = Lexer_1.Lexer.scan('\t\t  \t     \t');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Eof]);
    });
    it('retains every single newline', () => {
        let { tokens } = Lexer_1.Lexer.scan('\n\n\'foo\n\n\nprint 2\n\n');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Comment,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Print,
            TokenKind_1.TokenKind.IntegerLiteral,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('does not insert double newlines with the windows \\r\\n newline', () => {
        let kinds = Lexer_1.Lexer.scan('function boolToNumber() as string\r\n' +
            '   if true then\r\n' +
            '       print 1\r\n' +
            '   else\r\n' +
            '       print 0\r\n' +
            '   end if\r\n' +
            'end function\r\n').tokens.map(x => x.kind);
        (0, chai_config_spec_1.expect)(kinds).to.eql([
            TokenKind_1.TokenKind.Function, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.LeftParen, TokenKind_1.TokenKind.RightParen, TokenKind_1.TokenKind.As, TokenKind_1.TokenKind.String, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.If, TokenKind_1.TokenKind.True, TokenKind_1.TokenKind.Then, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Print, TokenKind_1.TokenKind.IntegerLiteral, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Else, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Print, TokenKind_1.TokenKind.IntegerLiteral, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.EndIf, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.EndFunction, TokenKind_1.TokenKind.Newline,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('computes range properly both with and without whitespace', () => {
        let withoutWhitespace = Lexer_1.Lexer.scan(`sub Main()\n    bob = true\nend sub`).tokens
            .map(x => (0, Parser_spec_1.rangeToArray)(x.range));
        let withWhitespace = Lexer_1.Lexer.scan(`sub Main()\n    bob = true\nend sub`).tokens
            //filter out the whitespace...we only care that it was computed during the scan
            .filter(x => x.kind !== TokenKind_1.TokenKind.Whitespace)
            .map(x => (0, Parser_spec_1.rangeToArray)(x.range));
        /*eslint-disable */
        let expectedLocations = [
            [0, 0, 0, 3],
            [0, 4, 0, 8],
            [0, 8, 0, 9],
            [0, 9, 0, 10],
            [0, 10, 0, 11],
            [1, 4, 1, 7],
            [1, 8, 1, 9],
            [1, 10, 1, 14],
            [1, 14, 1, 15],
            [2, 0, 2, 7],
            [2, 7, 2, 8] //Eof
        ];
        /*eslint-enable*/
        (0, chai_config_spec_1.expect)(withoutWhitespace, 'Without whitespace').to.eql(expectedLocations);
        (0, chai_config_spec_1.expect)(withWhitespace, 'With whitespace').to.eql(expectedLocations);
    });
    it('retains original line endings', () => {
        let { tokens } = Lexer_1.Lexer.scan('print "hello"\r\nprint "world"\n');
        (0, chai_config_spec_1.expect)([
            tokens[2].text.charCodeAt(0),
            tokens[2].text.charCodeAt(1)
        ], 'should contain \\r\\n').to.eql([13, 10]);
        (0, chai_config_spec_1.expect)(tokens[5].text.charCodeAt(0), 'should contain \\r\\n').to.eql(10);
    });
    it('correctly splits the elseif token', () => {
        let { tokens } = Lexer_1.Lexer.scan('else if elseif else   if');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
            TokenKind_1.TokenKind.Else,
            TokenKind_1.TokenKind.If,
            TokenKind_1.TokenKind.Else,
            TokenKind_1.TokenKind.If,
            TokenKind_1.TokenKind.Else,
            TokenKind_1.TokenKind.If,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('gives the `as` keyword its own TokenKind', () => {
        let { tokens } = Lexer_1.Lexer.scan('as');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.As, TokenKind_1.TokenKind.Eof]);
    });
    it('gives the `stop` keyword its own TokenKind', () => {
        let { tokens } = Lexer_1.Lexer.scan('stop');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Stop, TokenKind_1.TokenKind.Eof]);
    });
    it('does not alias \'?\' to \'print\' - the parser will do that', () => {
        let { tokens } = Lexer_1.Lexer.scan('?2');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Question, TokenKind_1.TokenKind.IntegerLiteral, TokenKind_1.TokenKind.Eof]);
    });
    describe('comments', () => {
        it('does not include carriage return character', () => {
            let tokens = Lexer_1.Lexer.scan(`'someComment\r\nprint "hello"`).tokens;
            (0, chai_config_spec_1.expect)(tokens[0].text).to.equal(`'someComment`);
        });
        it('includes the comment characters in the text', () => {
            let text = Lexer_1.Lexer.scan(`
                'comment
                REM some comment
            `).tokens
                .filter(x => ![TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Eof].includes(x.kind))
                .map(x => x.text);
            (0, chai_config_spec_1.expect)(text).to.eql([
                `'comment`,
                'REM some comment'
            ]);
        });
        it('tracks the correct location', () => {
            let tokens = Lexer_1.Lexer.scan(`
                sub main() 'first comment
                    k = 2 ' second comment
                    REM third comment
                end sub
            `, {
                includeWhitespace: true
            }).tokens.map(x => [...(0, Parser_spec_1.rangeToArray)(x.range), x.text]);
            (0, chai_config_spec_1.expect)(tokens).to.eql([
                [0, 0, 0, 1, '\n'],
                [1, 0, 1, 16, '                '],
                [1, 16, 1, 19, 'sub'],
                [1, 19, 1, 20, ' '],
                [1, 20, 1, 24, 'main'],
                [1, 24, 1, 25, '('],
                [1, 25, 1, 26, ')'],
                [1, 26, 1, 27, ' '],
                [1, 27, 1, 41, `'first comment`],
                [1, 41, 1, 42, '\n'],
                [2, 0, 2, 20, '                    '],
                [2, 20, 2, 21, 'k'],
                [2, 21, 2, 22, ' '],
                [2, 22, 2, 23, '='],
                [2, 23, 2, 24, ' '],
                [2, 24, 2, 25, '2'],
                [2, 25, 2, 26, ' '],
                [2, 26, 2, 42, `' second comment`],
                [2, 42, 2, 43, '\n'],
                [3, 0, 3, 20, '                    '],
                [3, 20, 3, 37, 'REM third comment'],
                [3, 37, 3, 38, '\n'],
                [4, 0, 4, 16, '                '],
                [4, 16, 4, 23, 'end sub'],
                [4, 23, 4, 24, '\n'],
                [5, 0, 5, 12, '            '],
                [5, 12, 5, 13, ''] //EOF
            ]);
        });
        it('tracks the correct location for comments', () => {
            let tokens = Lexer_1.Lexer.scan(`
                'comment
                REM some comment
            `).tokens.filter(x => ![TokenKind_1.TokenKind.Newline, TokenKind_1.TokenKind.Eof].includes(x.kind));
            (0, chai_config_spec_1.expect)(tokens[0].range).to.eql(vscode_languageserver_1.Range.create(1, 16, 1, 24));
            (0, chai_config_spec_1.expect)(tokens[1].range).to.eql(vscode_languageserver_1.Range.create(2, 16, 2, 32));
        });
        it('finds correct location for newlines', () => {
            let tokens = Lexer_1.Lexer.scan('sub\nsub\r\nsub\n\n').tokens
                //ignore the Eof token
                .filter(x => x.kind !== TokenKind_1.TokenKind.Eof);
            (0, chai_config_spec_1.expect)(tokens.map(x => x.range)).to.eql([
                vscode_languageserver_1.Range.create(0, 0, 0, 3),
                vscode_languageserver_1.Range.create(0, 3, 0, 4),
                vscode_languageserver_1.Range.create(1, 0, 1, 3),
                vscode_languageserver_1.Range.create(1, 3, 1, 5),
                vscode_languageserver_1.Range.create(2, 0, 2, 3),
                vscode_languageserver_1.Range.create(2, 3, 2, 4),
                vscode_languageserver_1.Range.create(3, 0, 3, 1) //  /n
            ]);
        });
        it('finds correct location for comment after if statement', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                sub a()
                    if true then
                        print false
                    else if true then
                        print "true"
                    else
                        print "else"
                    end if 'comment
                end sub
            `);
            let comments = tokens.filter(x => x.kind === TokenKind_1.TokenKind.Comment);
            (0, chai_config_spec_1.expect)(comments).to.be.lengthOf(1);
            (0, chai_config_spec_1.expect)(comments[0].range).to.eql(vscode_languageserver_1.Range.create(8, 27, 8, 35));
        });
        it('ignores everything after `\'`', () => {
            let { tokens } = Lexer_1.Lexer.scan('= \' (');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Eof]);
        });
        it('ignores everything after `REM`', () => {
            let { tokens } = Lexer_1.Lexer.scan('= REM (');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Eof]);
        });
        it('ignores everything after `rem`', () => {
            let { tokens } = Lexer_1.Lexer.scan('= rem (');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.Comment, TokenKind_1.TokenKind.Eof]);
        });
    }); // comments
    describe('non-literals', () => {
        it('reads parens & braces', () => {
            let { tokens } = Lexer_1.Lexer.scan('(){}');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.LeftCurlyBrace,
                TokenKind_1.TokenKind.RightCurlyBrace,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads operators', () => {
            let { tokens } = Lexer_1.Lexer.scan('^ - + * MOD / \\ -- ++');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.Caret,
                TokenKind_1.TokenKind.Minus,
                TokenKind_1.TokenKind.Plus,
                TokenKind_1.TokenKind.Star,
                TokenKind_1.TokenKind.Mod,
                TokenKind_1.TokenKind.Forwardslash,
                TokenKind_1.TokenKind.Backslash,
                TokenKind_1.TokenKind.MinusMinus,
                TokenKind_1.TokenKind.PlusPlus,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads bitshift operators', () => {
            let { tokens } = Lexer_1.Lexer.scan('<< >> <<');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.LeftShift,
                TokenKind_1.TokenKind.RightShift,
                TokenKind_1.TokenKind.LeftShift,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads bitshift assignment operators', () => {
            let { tokens } = Lexer_1.Lexer.scan('<<= >>=');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.LeftShiftEqual,
                TokenKind_1.TokenKind.RightShiftEqual,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads comparators', () => {
            let { tokens } = Lexer_1.Lexer.scan('< <= > >= = <>');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.Less,
                TokenKind_1.TokenKind.LessEqual,
                TokenKind_1.TokenKind.Greater,
                TokenKind_1.TokenKind.GreaterEqual,
                TokenKind_1.TokenKind.Equal,
                TokenKind_1.TokenKind.LessGreater,
                TokenKind_1.TokenKind.Eof
            ]);
        });
    }); // non-literals
    describe('string literals', () => {
        it('produces string literal tokens', () => {
            let { tokens } = Lexer_1.Lexer.scan(`"hello world"`);
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([TokenKind_1.TokenKind.StringLiteral, TokenKind_1.TokenKind.Eof]);
        });
        it(`safely escapes " literals`, () => {
            let { tokens } = Lexer_1.Lexer.scan(`"the cat says ""meow"""`);
            (0, chai_config_spec_1.expect)(tokens[0].kind).to.equal(TokenKind_1.TokenKind.StringLiteral);
        });
        it('captures text to end of line for unterminated strings with LF', () => {
            let { tokens } = Lexer_1.Lexer.scan(`"unterminated!\n`);
            (0, chai_config_spec_1.expect)(tokens[0].kind).to.eql(TokenKind_1.TokenKind.StringLiteral);
        });
        it('captures text to end of line for unterminated strings with CRLF', () => {
            let { tokens } = Lexer_1.Lexer.scan(`"unterminated!\r\n`);
            (0, chai_config_spec_1.expect)(tokens[0].text).to.equal('"unterminated!');
        });
        it('disallows multiline strings', () => {
            let { diagnostics } = Lexer_1.Lexer.scan(`"multi-line\n\n`);
            (0, chai_config_spec_1.expect)(diagnostics.map(err => err.message)).to.deep.equal([
                'Unterminated string at end of line'
            ]);
        });
    });
    // template string literals
    describe('template string literals', () => {
        it('supports escaped chars', () => {
            let { tokens } = Lexer_1.Lexer.scan('`\\n\\`\\r\\n`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens.map(x => x.charCode).filter(x => !!x)).to.eql([
                10,
                96,
                13,
                10
            ]);
        });
        it('prevents expressions when escaping the dollar sign', () => {
            let { tokens } = Lexer_1.Lexer.scan('`\\${just text}`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('supports escaping unicode char codes', () => {
            let { tokens } = Lexer_1.Lexer.scan('`\\c1\\c12\\c123`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens.map(x => x.charCode).filter(x => !!x)).to.eql([
                1,
                12,
                123
            ]);
        });
        it('converts doublequote to EscapedCharCodeLiteral', () => {
            let { tokens } = Lexer_1.Lexer.scan('`"`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens[2].charCode).to.equal(34);
        });
        it(`safely escapes \` literals`, () => {
            let { tokens } = Lexer_1.Lexer.scan('`the cat says \\`meow\\` a lot`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens.map(x => x.text)).to.eql([
                '`',
                'the cat says ',
                '\\`',
                'meow',
                '\\`',
                ' a lot',
                '`',
                '' //EOF
            ]);
        });
        it('produces template string literal tokens', () => {
            let { tokens } = Lexer_1.Lexer.scan('`hello world`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens[1].text).to.deep.equal('hello world');
        });
        it('collects quasis outside and expressions inside of template strings', () => {
            let { tokens } = Lexer_1.Lexer.scan('`hello ${"world"}!`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens[1].text).to.deep.equal(`hello `);
        });
        it('real example, which is causing issues in the formatter', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                function getItemXML(item)
                    return \`
                        <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
                        <channel>
                            <title>smithsonian</title>
                            <item>
                                <title>\${item.title}</title>
                                <guid>\${item.vamsId}</guid>
                                <media:rating scheme="urn:v-chip">\${item.ratings.first.code.name}</media:rating>
                            </item>
                        </channel>
                        </rss>
                    \`
                end function
            `);
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.Function,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.Return,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.EndFunction,
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('complicated example', () => {
            let { tokens } = Lexer_1.Lexer.scan('`hello ${"world"}!I am a ${"template" + "string"} and I am very ${["pleased"][0]} to meet you ${m.top.getChildCount()}.The end`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.eql([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.Plus,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.LeftSquareBracket,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.RightSquareBracket,
                TokenKind_1.TokenKind.LeftSquareBracket,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.RightSquareBracket,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('allows multiline strings', () => {
            let { tokens } = Lexer_1.Lexer.scan('`multi-line\n\n`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens.map(x => x.text)).to.eql([
                '`',
                'multi-line',
                '\n',
                '',
                '\n',
                '',
                '`',
                '' //EOF
            ]);
        });
        it('maintains proper line/column locations for multiline strings', () => {
            let { tokens } = Lexer_1.Lexer.scan('123 `multi\nline\r\nstrings` true\nfalse');
            (0, chai_config_spec_1.expect)(tokens.map(x => {
                return {
                    range: x.range,
                    kind: x.kind
                };
            })).to.eql([
                { range: vscode_languageserver_1.Range.create(0, 0, 0, 3), kind: TokenKind_1.TokenKind.IntegerLiteral },
                { range: vscode_languageserver_1.Range.create(0, 4, 0, 5), kind: TokenKind_1.TokenKind.BackTick },
                { range: vscode_languageserver_1.Range.create(0, 5, 0, 10), kind: TokenKind_1.TokenKind.TemplateStringQuasi },
                { range: vscode_languageserver_1.Range.create(0, 10, 0, 11), kind: TokenKind_1.TokenKind.EscapedCharCodeLiteral },
                { range: vscode_languageserver_1.Range.create(1, 0, 1, 4), kind: TokenKind_1.TokenKind.TemplateStringQuasi },
                { range: vscode_languageserver_1.Range.create(1, 4, 1, 5), kind: TokenKind_1.TokenKind.EscapedCharCodeLiteral },
                { range: vscode_languageserver_1.Range.create(1, 5, 1, 6), kind: TokenKind_1.TokenKind.EscapedCharCodeLiteral },
                { range: vscode_languageserver_1.Range.create(2, 0, 2, 7), kind: TokenKind_1.TokenKind.TemplateStringQuasi },
                { range: vscode_languageserver_1.Range.create(2, 7, 2, 8), kind: TokenKind_1.TokenKind.BackTick },
                { range: vscode_languageserver_1.Range.create(2, 9, 2, 13), kind: TokenKind_1.TokenKind.True },
                { range: vscode_languageserver_1.Range.create(2, 13, 2, 14), kind: TokenKind_1.TokenKind.Newline },
                { range: vscode_languageserver_1.Range.create(3, 0, 3, 5), kind: TokenKind_1.TokenKind.False },
                { range: vscode_languageserver_1.Range.create(3, 5, 3, 6), kind: TokenKind_1.TokenKind.Eof }
            ]);
        });
        it('Example that tripped up the expression tests', () => {
            let { tokens } = Lexer_1.Lexer.scan('`I am a complex example\n${a.isRunning(["a","b","c"])}\nmore ${m.finish(true)}`');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.LeftSquareBracket,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.Comma,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.Comma,
                TokenKind_1.TokenKind.StringLiteral,
                TokenKind_1.TokenKind.RightSquareBracket,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.EscapedCharCodeLiteral,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.TemplateStringExpressionBegin,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Dot,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.True,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.TemplateStringExpressionEnd,
                TokenKind_1.TokenKind.TemplateStringQuasi,
                TokenKind_1.TokenKind.BackTick,
                TokenKind_1.TokenKind.Eof
            ]);
        });
    }); // string literals
    describe('double literals', () => {
        it('respects \'#\' suffix', () => {
            let d = Lexer_1.Lexer.scan('123#').tokens[0];
            (0, chai_config_spec_1.expect)(d.kind).to.equal(TokenKind_1.TokenKind.DoubleLiteral);
            (0, chai_config_spec_1.expect)(d.text).to.eql('123#');
        });
        it('forces literals >= 10 digits into doubles', () => {
            let d = Lexer_1.Lexer.scan('0000000005').tokens[0];
            (0, chai_config_spec_1.expect)(d.kind).to.equal(TokenKind_1.TokenKind.DoubleLiteral);
            (0, chai_config_spec_1.expect)(d.text).to.eql('0000000005');
        });
        it('forces literals with \'D\' in exponent into doubles', () => {
            let d = Lexer_1.Lexer.scan('2.5d3').tokens[0];
            (0, chai_config_spec_1.expect)(d.kind).to.equal(TokenKind_1.TokenKind.DoubleLiteral);
            (0, chai_config_spec_1.expect)(d.text).to.eql('2.5d3');
        });
        it('allows digits before `.` to be elided', () => {
            let f = Lexer_1.Lexer.scan('.123#').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.DoubleLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('.123#');
        });
        it('allows digits after `.` to be elided', () => {
            let f = Lexer_1.Lexer.scan('12.#').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.DoubleLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('12.#');
        });
    });
    describe('float literals', () => {
        it('respects \'!\' suffix', () => {
            let f = Lexer_1.Lexer.scan('0.00000008!').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            // Floating precision will make this *not* equal
            (0, chai_config_spec_1.expect)(f.text).not.to.equal(8e-8);
            (0, chai_config_spec_1.expect)(f.text).to.eql('0.00000008!');
        });
        it('forces literals with a decimal into floats', () => {
            let f = Lexer_1.Lexer.scan('1.0').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.equal('1.0');
        });
        it('forces literals with \'E\' in exponent into floats', () => {
            let f = Lexer_1.Lexer.scan('2.5e3').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('2.5e3');
        });
        it('supports very long numbers with !', () => {
            function doTest(number) {
                let f = Lexer_1.Lexer.scan(number).tokens[0];
                (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
                (0, chai_config_spec_1.expect)(f.text).to.eql(number);
            }
            doTest('0!');
            doTest('0!');
            doTest('147483648!');
            doTest('2147483648!');
            doTest('2147483648111!');
            doTest('2.4e-38!');
            doTest('2.4e-32342342342342342342342342348!');
            doTest('2.4e+32342342342342342342342342348!');
        });
        it('supports larger-than-supported-precision floats to be defined with exponents', () => {
            let f = Lexer_1.Lexer.scan('2.3659475627512424e-38').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('2.3659475627512424e-38');
        });
        it('allows digits before `.` to be elided', () => {
            let f = Lexer_1.Lexer.scan('.123').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.equal('.123');
        });
        it('allows digits after `.` to be elided', () => {
            let f = Lexer_1.Lexer.scan('12.').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.equal('12.');
        });
    });
    describe('long integer literals', () => {
        it('respects \'&\' suffix', () => {
            let f = Lexer_1.Lexer.scan('1&').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.LongIntegerLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('1&');
        });
        it('supports hexadecimal literals', () => {
            let i = Lexer_1.Lexer.scan('&hf00d&').tokens[0];
            (0, chai_config_spec_1.expect)(i.kind).to.equal(TokenKind_1.TokenKind.LongIntegerLiteral);
            (0, chai_config_spec_1.expect)(i.text).to.equal('&hf00d&');
        });
        it('allows very long Int64 literals', () => {
            let li = Lexer_1.Lexer.scan('9876543210&').tokens[0];
            (0, chai_config_spec_1.expect)(li.kind).to.equal(TokenKind_1.TokenKind.LongIntegerLiteral);
            (0, chai_config_spec_1.expect)(li.text).to.equal('9876543210&');
        });
        it('forces literals with \'&\' suffix into Int64s', () => {
            let li = Lexer_1.Lexer.scan('123&').tokens[0];
            (0, chai_config_spec_1.expect)(li.kind).to.equal(TokenKind_1.TokenKind.LongIntegerLiteral);
            (0, chai_config_spec_1.expect)(li.text).to.deep.equal('123&');
        });
    });
    describe('integer literals', () => {
        it('respects \'%\' suffix', () => {
            let f = Lexer_1.Lexer.scan('1%').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.IntegerLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('1%');
        });
        it('does not allow decimal numbers to end with %', () => {
            let f = Lexer_1.Lexer.scan('1.2%').tokens[0];
            (0, chai_config_spec_1.expect)(f.kind).to.equal(TokenKind_1.TokenKind.FloatLiteral);
            (0, chai_config_spec_1.expect)(f.text).to.eql('1.2');
        });
        it('supports hexadecimal literals', () => {
            let i = Lexer_1.Lexer.scan('&hFf').tokens[0];
            (0, chai_config_spec_1.expect)(i.kind).to.equal(TokenKind_1.TokenKind.IntegerLiteral);
            (0, chai_config_spec_1.expect)(i.text).to.deep.equal('&hFf');
        });
        it('falls back to a regular integer', () => {
            let i = Lexer_1.Lexer.scan('123').tokens[0];
            (0, chai_config_spec_1.expect)(i.kind).to.equal(TokenKind_1.TokenKind.IntegerLiteral);
            (0, chai_config_spec_1.expect)(i.text).to.deep.equal('123');
        });
    });
    describe('types', () => {
        it('captures type tokens', () => {
            (0, chai_config_spec_1.expect)(Lexer_1.Lexer.scan(`
                void boolean integer longinteger float double string object interface invalid dynamic
            `.trim()).tokens.map(x => x.kind)).to.eql([
                TokenKind_1.TokenKind.Void,
                TokenKind_1.TokenKind.Boolean,
                TokenKind_1.TokenKind.Integer,
                TokenKind_1.TokenKind.LongInteger,
                TokenKind_1.TokenKind.Float,
                TokenKind_1.TokenKind.Double,
                TokenKind_1.TokenKind.String,
                TokenKind_1.TokenKind.Object,
                TokenKind_1.TokenKind.Interface,
                TokenKind_1.TokenKind.Invalid,
                TokenKind_1.TokenKind.Dynamic,
                TokenKind_1.TokenKind.Eof
            ]);
        });
    });
    describe('identifiers', () => {
        it('matches single-word keywords', () => {
            // test just a sample of single-word reserved words for now.
            // if we find any that we've missed
            let { tokens } = Lexer_1.Lexer.scan('and then or if else endif return true false line_num');
            (0, chai_config_spec_1.expect)(tokens.map(w => w.kind)).to.deep.equal([
                TokenKind_1.TokenKind.And,
                TokenKind_1.TokenKind.Then,
                TokenKind_1.TokenKind.Or,
                TokenKind_1.TokenKind.If,
                TokenKind_1.TokenKind.Else,
                TokenKind_1.TokenKind.EndIf,
                TokenKind_1.TokenKind.Return,
                TokenKind_1.TokenKind.True,
                TokenKind_1.TokenKind.False,
                TokenKind_1.TokenKind.LineNumLiteral,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('matches multi-word keywords', () => {
            let { tokens } = Lexer_1.Lexer.scan('end if end while End Sub end Function Exit wHILe');
            (0, chai_config_spec_1.expect)(tokens.map(w => w.kind)).to.deep.equal([
                TokenKind_1.TokenKind.EndIf,
                TokenKind_1.TokenKind.EndWhile,
                TokenKind_1.TokenKind.EndSub,
                TokenKind_1.TokenKind.EndFunction,
                TokenKind_1.TokenKind.ExitWhile,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('accepts \'exit for\' but not \'exitfor\'', () => {
            let { tokens } = Lexer_1.Lexer.scan('exit for exitfor');
            (0, chai_config_spec_1.expect)(tokens.map(w => w.kind)).to.deep.equal([
                TokenKind_1.TokenKind.ExitFor,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('matches keywords with silly capitalization', () => {
            let { tokens } = Lexer_1.Lexer.scan('iF ELSE eNDIf FUncTioN');
            (0, chai_config_spec_1.expect)(tokens.map(w => w.kind)).to.deep.equal([
                TokenKind_1.TokenKind.If,
                TokenKind_1.TokenKind.Else,
                TokenKind_1.TokenKind.EndIf,
                TokenKind_1.TokenKind.Function,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('allows alpha-numeric (plus \'_\') identifiers', () => {
            let identifier = Lexer_1.Lexer.scan('_abc_123_').tokens[0];
            (0, chai_config_spec_1.expect)(identifier.kind).to.equal(TokenKind_1.TokenKind.Identifier);
            (0, chai_config_spec_1.expect)(identifier.text).to.equal('_abc_123_');
        });
        it('allows identifiers with trailing type designators', () => {
            let { tokens } = Lexer_1.Lexer.scan('lorem$ ipsum% dolor! sit# amet&');
            let identifiers = tokens.filter(t => t.kind !== TokenKind_1.TokenKind.Eof);
            (0, chai_config_spec_1.expect)(identifiers.every(t => t.kind === TokenKind_1.TokenKind.Identifier));
            (0, chai_config_spec_1.expect)(identifiers.map(t => t.text)).to.deep.equal([
                'lorem$',
                'ipsum%',
                'dolor!',
                'sit#',
                'amet&'
            ]);
        });
    });
    describe('conditional compilation', () => {
        it('reads constant declarations', () => {
            let { tokens } = Lexer_1.Lexer.scan('#const foo true');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.HashConst,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.True,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('handles whitespace between hash and keywords', () => {
            function doTest(text, ...expected) {
                let { tokens } = Lexer_1.Lexer.scan(text);
                (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                    ...expected,
                    TokenKind_1.TokenKind.Eof
                ]);
            }
            //#if
            doTest('# if true', TokenKind_1.TokenKind.HashIf, TokenKind_1.TokenKind.True);
            doTest('#\tif true', TokenKind_1.TokenKind.HashIf, TokenKind_1.TokenKind.True);
            doTest('#\t   \t\t \tif true', TokenKind_1.TokenKind.HashIf, TokenKind_1.TokenKind.True);
            //#else
            doTest('# else', TokenKind_1.TokenKind.HashElse);
            doTest('#\telse', TokenKind_1.TokenKind.HashElse);
            doTest('#\t   \t\t \telse', TokenKind_1.TokenKind.HashElse);
            //#elseif
            doTest('# elseif true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            doTest('#\telseif true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            doTest('#\t   \t\t \telseif true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            //#else if
            doTest('# else if true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            doTest('#\t elseif true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            doTest('#\t   \t\t \t else if true', TokenKind_1.TokenKind.HashElseIf, TokenKind_1.TokenKind.True);
            //#endif
            doTest('# endif', TokenKind_1.TokenKind.HashEndIf);
            doTest('#\tendif', TokenKind_1.TokenKind.HashEndIf);
            doTest('#\t   \t\t \tendif', TokenKind_1.TokenKind.HashEndIf);
            //#end if
            doTest('# end if', TokenKind_1.TokenKind.HashEndIf);
            doTest('#\tend if', TokenKind_1.TokenKind.HashEndIf);
            doTest('#\t   \t\t \tend if', TokenKind_1.TokenKind.HashEndIf);
            //#const
            doTest('# const thing=true', TokenKind_1.TokenKind.HashConst, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.True);
            doTest('#\tconst thing=true', TokenKind_1.TokenKind.HashConst, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.True);
            doTest('#\t   \t\t \tconst thing=true', TokenKind_1.TokenKind.HashConst, TokenKind_1.TokenKind.Identifier, TokenKind_1.TokenKind.Equal, TokenKind_1.TokenKind.True);
            //#error
            doTest('# error', TokenKind_1.TokenKind.HashError);
            doTest('#\terror', TokenKind_1.TokenKind.HashError);
            doTest('#\t   \t\t \terror', TokenKind_1.TokenKind.HashError);
        });
        it('reads constant aliases', () => {
            let { tokens } = Lexer_1.Lexer.scan('#const bar foo');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.HashConst,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads conditional directives', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                #if
                #else if
                #elseif
                #else
                #end if
                #endif
            `, {
                includeWhitespace: false
            });
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind).filter(x => x !== TokenKind_1.TokenKind.Newline)).to.deep.equal([
                TokenKind_1.TokenKind.HashIf,
                TokenKind_1.TokenKind.HashElseIf,
                TokenKind_1.TokenKind.HashElseIf,
                TokenKind_1.TokenKind.HashElse,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('treats text "constructor" as an identifier', () => {
            let lexer = Lexer_1.Lexer.scan(`function constructor()\nend function`);
            (0, chai_config_spec_1.expect)(lexer.tokens[1].kind).to.equal(TokenKind_1.TokenKind.Identifier);
        });
        it('reads upper case conditional directives', () => {
            let { tokens } = Lexer_1.Lexer.scan(`
                #IF
                #ELSE IF
                #ELSEIF
                #ELSE
                #END IF
                #ENDIF
            `, {
                includeWhitespace: false
            });
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind).filter(x => x !== TokenKind_1.TokenKind.Newline)).to.deep.equal([
                TokenKind_1.TokenKind.HashIf,
                TokenKind_1.TokenKind.HashElseIf,
                TokenKind_1.TokenKind.HashElseIf,
                TokenKind_1.TokenKind.HashElse,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('supports various spacings between #endif', () => {
            let { tokens } = Lexer_1.Lexer.scan('#endif #end if #end\tif #end  if #end\t\t if');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.HashEndIf,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('does not require a message after #error', () => {
            let { tokens } = Lexer_1.Lexer.scan('#error');
            (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
                TokenKind_1.TokenKind.HashError,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('reads forced compilation diagnostics with messages', () => {
            let { tokens } = Lexer_1.Lexer.scan('#error a message goes here\n', {
                includeWhitespace: true
            });
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.HashError,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.HashErrorMessage,
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.Eof
            ]);
            (0, chai_config_spec_1.expect)(tokens[2].text).to.equal('a message goes here');
        });
    });
    describe('location tracking', () => {
        it('tracks starting and ending locations including whitespace', () => {
            let { tokens } = Lexer_1.Lexer.scan(`sub foo()\n    print "bar"\r\nend sub`, { includeWhitespace: true });
            (0, chai_config_spec_1.expect)(tokens.map(t => t.range)).to.eql([
                vscode_languageserver_1.Range.create(0, 0, 0, 3),
                vscode_languageserver_1.Range.create(0, 3, 0, 4),
                vscode_languageserver_1.Range.create(0, 4, 0, 7),
                vscode_languageserver_1.Range.create(0, 7, 0, 8),
                vscode_languageserver_1.Range.create(0, 8, 0, 9),
                vscode_languageserver_1.Range.create(0, 9, 0, 10),
                vscode_languageserver_1.Range.create(1, 0, 1, 4),
                vscode_languageserver_1.Range.create(1, 4, 1, 9),
                vscode_languageserver_1.Range.create(1, 9, 1, 10),
                vscode_languageserver_1.Range.create(1, 10, 1, 15),
                vscode_languageserver_1.Range.create(1, 15, 1, 17),
                vscode_languageserver_1.Range.create(2, 0, 2, 7),
                vscode_languageserver_1.Range.create(2, 7, 2, 8) // EOF
            ]);
        });
        it('tracks starting and ending locations excluding whitespace', () => {
            let { tokens } = Lexer_1.Lexer.scan(`sub foo()\n    print "bar"\r\nend sub`, { includeWhitespace: false });
            (0, chai_config_spec_1.expect)(tokens.map(t => t.range)).to.eql([
                vscode_languageserver_1.Range.create(0, 0, 0, 3),
                vscode_languageserver_1.Range.create(0, 4, 0, 7),
                vscode_languageserver_1.Range.create(0, 7, 0, 8),
                vscode_languageserver_1.Range.create(0, 8, 0, 9),
                vscode_languageserver_1.Range.create(0, 9, 0, 10),
                vscode_languageserver_1.Range.create(1, 4, 1, 9),
                vscode_languageserver_1.Range.create(1, 10, 1, 15),
                vscode_languageserver_1.Range.create(1, 15, 1, 17),
                vscode_languageserver_1.Range.create(2, 0, 2, 7),
                vscode_languageserver_1.Range.create(2, 7, 2, 8) // EOF
            ]);
        });
    });
    describe('two word keywords', () => {
        it('supports various spacing between for each', () => {
            let { tokens } = Lexer_1.Lexer.scan('for each for  each for    each for\teach for\t each for \teach for \t each');
            (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.deep.equal([
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.ForEach,
                TokenKind_1.TokenKind.Eof
            ]);
        });
    });
    it('detects rem when used as keyword', () => {
        let { tokens } = Lexer_1.Lexer.scan('person.rem=true');
        (0, chai_config_spec_1.expect)(tokens.map(t => t.kind)).to.eql([
            TokenKind_1.TokenKind.Identifier,
            TokenKind_1.TokenKind.Dot,
            TokenKind_1.TokenKind.Identifier,
            TokenKind_1.TokenKind.Equal,
            TokenKind_1.TokenKind.True,
            TokenKind_1.TokenKind.Eof
        ]);
        //verify the location of `rem`
        (0, chai_config_spec_1.expect)(tokens.map(t => [t.range.start.character, t.range.end.character])).to.eql([
            [0, 6],
            [6, 7],
            [7, 10],
            [10, 11],
            [11, 15],
            [15, 16] // EOF
        ]);
    });
    describe('isToken', () => {
        it('works', () => {
            let range = vscode_languageserver_1.Range.create(0, 0, 0, 2);
            (0, chai_config_spec_1.expect)((0, Token_1.isToken)({ kind: TokenKind_1.TokenKind.And, text: 'and', range: range })).is.true;
            (0, chai_config_spec_1.expect)((0, Token_1.isToken)({ text: 'and', range: range })).is.false;
        });
    });
    it('recognizes enum-related keywords', () => {
        (0, chai_config_spec_1.expect)(Lexer_1.Lexer.scan('enum end enum endenum').tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Enum,
            TokenKind_1.TokenKind.EndEnum,
            TokenKind_1.TokenKind.EndEnum,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('recognizes class-related keywords', () => {
        (0, chai_config_spec_1.expect)(Lexer_1.Lexer.scan('class public protected private end class endclass new override').tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Class,
            TokenKind_1.TokenKind.Public,
            TokenKind_1.TokenKind.Protected,
            TokenKind_1.TokenKind.Private,
            TokenKind_1.TokenKind.EndClass,
            TokenKind_1.TokenKind.EndClass,
            TokenKind_1.TokenKind.New,
            TokenKind_1.TokenKind.Override,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    describe('whitespace', () => {
        it('preserves the exact number of whitespace characterswhitespace', () => {
            let { tokens } = Lexer_1.Lexer.scan('   ', { includeWhitespace: true });
            (0, chai_config_spec_1.expect)(tokens[0]).to.include({
                kind: TokenKind_1.TokenKind.Whitespace,
                text: '   '
            });
        });
        it('tokenizes whitespace between things', () => {
            let { tokens } = Lexer_1.Lexer.scan('sub main ( ) \n end sub', { includeWhitespace: true });
            (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
                TokenKind_1.TokenKind.Sub,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.Newline,
                TokenKind_1.TokenKind.Whitespace,
                TokenKind_1.TokenKind.EndSub,
                TokenKind_1.TokenKind.Eof
            ]);
        });
    });
    it('identifies brighterscript source literals', () => {
        let { tokens } = Lexer_1.Lexer.scan('LINE_NUM SOURCE_FILE_PATH SOURCE_LINE_NUM FUNCTION_NAME SOURCE_FUNCTION_NAME SOURCE_NAMESPACE_NAME SOURCE_NAMESPACE_ROOT_NAME SOURCE_LOCATION PKG_PATH PKG_LOCATION');
        (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.LineNumLiteral,
            TokenKind_1.TokenKind.SourceFilePathLiteral,
            TokenKind_1.TokenKind.SourceLineNumLiteral,
            TokenKind_1.TokenKind.FunctionNameLiteral,
            TokenKind_1.TokenKind.SourceFunctionNameLiteral,
            TokenKind_1.TokenKind.SourceNamespaceNameLiteral,
            TokenKind_1.TokenKind.SourceNamespaceRootNameLiteral,
            TokenKind_1.TokenKind.SourceLocationLiteral,
            TokenKind_1.TokenKind.PkgPathLiteral,
            TokenKind_1.TokenKind.PkgLocationLiteral,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    it('properly tracks leadingWhitespace', () => {
        const text = `
            sub main()

                print "main"\r\n\n

            end sub
        `;
        const { tokens } = Lexer_1.Lexer.scan(text, { includeWhitespace: false });
        (0, chai_config_spec_1.expect)(util_1.default.tokensToString(tokens)).to.equal(text);
    });
    it('properly detects try/catch tokens', () => {
        const { tokens } = Lexer_1.Lexer.scan(`try catch endtry end try throw`, { includeWhitespace: false });
        (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Try,
            TokenKind_1.TokenKind.Catch,
            TokenKind_1.TokenKind.EndTry,
            TokenKind_1.TokenKind.EndTry,
            TokenKind_1.TokenKind.Throw,
            TokenKind_1.TokenKind.Eof
        ]);
    });
    describe('regular expression literals', () => {
        function testRegex(...regexps) {
            regexps = regexps.map(x => x.toString());
            const results = [];
            for (const regexp of regexps) {
                const { tokens } = Lexer_1.Lexer.scan(regexp);
                results.push(tokens[0].text);
            }
            (0, chai_config_spec_1.expect)(results).to.eql(regexps);
        }
        it('recognizes regex literals', () => {
            testRegex(/simple/, /SimpleWithValidFlags/g, /UnknownFlags/gi, /with spaces/s, /with(parens)and[squarebraces]/, 
            //lots of special characters
            /.*()^$@/, 
            //captures quote char
            /"/);
        });
        it('does not capture multiple divisions on one line as regex', () => {
            const { tokens } = Lexer_1.Lexer.scan(`one = 1/2 + 1/4 + 1/4`, {
                includeWhitespace: false
            });
            (0, chai_config_spec_1.expect)(tokens.map(x => x.kind)).to.eql([
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.Equal,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Forwardslash,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Plus,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Forwardslash,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Plus,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Forwardslash,
                TokenKind_1.TokenKind.IntegerLiteral,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('only captures alphanumeric flags', () => {
            (0, chai_config_spec_1.expect)(Lexer_1.Lexer.scan('speak(/a/)').tokens.map(x => x.kind)).to.eql([
                TokenKind_1.TokenKind.Identifier,
                TokenKind_1.TokenKind.LeftParen,
                TokenKind_1.TokenKind.RegexLiteral,
                TokenKind_1.TokenKind.RightParen,
                TokenKind_1.TokenKind.Eof
            ]);
        });
        it('handles escape characters properly', () => {
            testRegex(
            //an escaped forward slash right next to the end-regexp forwardslash
            /\//, /\r/, /\n/, /\r\n/, 
            //a literal backslash in front of an escape backslash
            /\\\n/);
        });
    });
    it('detects "continue" as a keyword', () => {
        (0, chai_config_spec_1.expect)(Lexer_1.Lexer.scan('continue').tokens.map(x => x.kind)).to.eql([
            TokenKind_1.TokenKind.Continue,
            TokenKind_1.TokenKind.Eof
        ]);
    });
});
function expectKinds(text, tokenKinds) {
    let actual = Lexer_1.Lexer.scan(text).tokens.map(x => x.kind);
    //remove the EOF token
    actual.pop();
    (0, chai_config_spec_1.expect)(actual).to.eql(tokenKinds);
}
//# sourceMappingURL=Lexer.spec.js.map