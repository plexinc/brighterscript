"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_spec_1 = require("../parser/tests/Parser.spec");
const TokenKind_1 = require("../lexer/TokenKind");
const Preprocessor_1 = require("./Preprocessor");
const Chunk_1 = require("./Chunk");
const chai_config_spec_1 = require("../chai-config.spec");
const sinon_1 = require("sinon");
let sinon = (0, sinon_1.createSandbox)();
describe('preprocessor', () => {
    afterEach(() => {
        sinon.restore();
    });
    it('forwards brightscript chunk contents unmodified', () => {
        let unprocessed = [
            (0, Parser_spec_1.identifier)('foo'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.LeftParen, '('),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.RightParen, ')'),
            (0, Parser_spec_1.token)(TokenKind_1.TokenKind.Newline, '\n'),
            Parser_spec_1.EOF
        ];
        let { processedTokens } = new Preprocessor_1.Preprocessor().filter([new Chunk_1.BrightScriptChunk(unprocessed)]);
        (0, chai_config_spec_1.expect)(processedTokens).to.eql(unprocessed);
    });
    describe('#const', () => {
        it('removes #const declarations from output', () => {
            let { processedTokens } = new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('lorem'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'))
            ]);
            (0, chai_config_spec_1.expect)(processedTokens).to.eql([]);
        });
        describe('values', () => {
            it('allows `true`', () => {
                (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('lorem'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'))
                ])).not.to.throw;
            });
            it('allows `false`', () => {
                (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('ipsum'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'))
                ])).not.to.throw;
            });
            it('allows identifiers', () => {
                (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                    // 'ipsum' must be defined before it's referenced
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('ipsum'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false')),
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('dolor'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'))
                ])).not.to.throw;
            });
            it('disallows strings', () => {
                (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('sit'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.String, 'good boy!'))
                ])).to.throw; //('#const declarations can only have');
            });
            it('disallows re-declaration of values', () => {
                (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('lorem'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false')),
                    new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('lorem'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'))
                ])).to.throw;
            });
        });
    });
    describe('#error', () => {
        it('throws error when #error directives encountered', () => {
            (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.ErrorChunk((0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashError, '#error'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashError, 'I\'m an error message!'))
            ])).to.throw;
        });
        it('doesn\'t throw when branched around', () => {
            (0, chai_config_spec_1.expect)(() => new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.HashIfStatement((0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'), [
                    new Chunk_1.ErrorChunk((0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashError, '#error'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.HashError, 'I\'m an error message!'))
                ], [] // no else-ifs necessary
                )
            ])).not.to.throw;
        });
    });
    describe('#if', () => {
        let elseChunk;
        let elseIfChunk;
        let ifChunk;
        beforeEach(() => {
            ifChunk = new Chunk_1.BrightScriptChunk([]);
            elseIfChunk = new Chunk_1.BrightScriptChunk([]);
            elseChunk = new Chunk_1.BrightScriptChunk([]);
            sinon.spy(ifChunk, 'accept');
            sinon.spy(elseIfChunk, 'accept');
            sinon.spy(elseChunk, 'accept');
        });
        it('enters #if branch', () => {
            new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.HashIfStatement((0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'), [ifChunk], [
                    {
                        condition: (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                        thenChunks: [elseIfChunk]
                    }
                ], [elseChunk])
            ]);
            (0, chai_config_spec_1.expect)(ifChunk.accept.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(elseIfChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseChunk.accept.callCount).to.equal(0);
        });
        it('enters #else if branch', () => {
            new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.HashIfStatement((0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'), [ifChunk], [
                    {
                        condition: (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true'),
                        thenChunks: [elseIfChunk]
                    }
                ], [elseChunk])
            ]);
            (0, chai_config_spec_1.expect)(ifChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseIfChunk.accept.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(elseChunk.accept.callCount).to.equal(0);
        });
        it('enters #else branch', () => {
            new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.HashIfStatement((0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'), [ifChunk], [
                    {
                        condition: (0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'),
                        thenChunks: [elseIfChunk]
                    }
                ], [elseChunk])
            ]);
            (0, chai_config_spec_1.expect)(ifChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseIfChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseChunk.accept.callCount).to.equal(1);
        });
        it('enters no branches if none pass', () => {
            new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.HashIfStatement((0, Parser_spec_1.token)(TokenKind_1.TokenKind.False, 'false'), [ifChunk], [] // no else-if chunks
                // NOTE: no 'else" chunk!
                )
            ]);
            (0, chai_config_spec_1.expect)(ifChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseIfChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseChunk.accept.callCount).to.equal(0);
        });
        it('uses #const values to determine truth', () => {
            new Preprocessor_1.Preprocessor().filter([
                new Chunk_1.DeclarationChunk((0, Parser_spec_1.identifier)('lorem'), (0, Parser_spec_1.token)(TokenKind_1.TokenKind.True, 'true')),
                new Chunk_1.HashIfStatement((0, Parser_spec_1.identifier)('lorem'), [ifChunk], [] // no else-if chunks
                // NOTE: no 'else" chunk!
                )
            ]);
            (0, chai_config_spec_1.expect)(ifChunk.accept.callCount).to.equal(1);
            (0, chai_config_spec_1.expect)(elseIfChunk.accept.callCount).to.equal(0);
            (0, chai_config_spec_1.expect)(elseChunk.accept.callCount).to.equal(0);
        });
    });
});
//# sourceMappingURL=Preprocessor.spec.js.map