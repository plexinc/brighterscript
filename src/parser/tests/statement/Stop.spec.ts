import { expect } from '../../../chai-config.spec';

import { Parser } from '../../Parser';
import { Lexer } from '../../../lexer/Lexer';
import { TokenKind } from '../../../lexer/TokenKind';
import { EOF, token } from '../Parser.spec';

describe('stop statement', () => {
    it('cannot be used as a local variable', () => {
        let { statements, diagnostics } = Parser.parse([
            token(TokenKind.Stop, 'stop'),
            token(TokenKind.Equal, '='),
            token(TokenKind.True, 'true'),
            EOF
        ]);

        //should be an error
        expect(diagnostics).to.be.length.greaterThan(0);
        expect(statements).to.exist;
        expect(statements).not.to.be.null;
    });

    it('is valid as a statement', () => {
        let { diagnostics } = Parser.parse([token(TokenKind.Stop, 'stop'), EOF]);
        expect(diagnostics[0]).to.be.undefined;
    });

    it('can be used as an object property', () => {
        let { tokens } = Lexer.scan(`
            sub Main()
                theObject = {
                    stop: false
                }
                theObject.stop = true
            end sub
        `);
        let { diagnostics } = Parser.parse(tokens);
        expect(diagnostics.length).to.equal(0);
    });
    it('supports @stop', () => {
        let { diagnostics } = Parser.parse([token(TokenKind.AtStop, '@stop'), EOF]);
        expect(diagnostics[0]).to.be.undefined;
    });

    it('supports @STOP', () => {
        let { diagnostics } = Parser.parse([token(TokenKind.AtStop, '@STOP'), EOF]);
        expect(diagnostics[0]).to.be.undefined;
    });

    it('lexer recognizes @stop', () => {
        let { tokens } = Lexer.scan('@stop');
        expect(tokens[0].kind).to.equal(TokenKind.AtStop);
    });

    it('lexer recognizes @STOP', () => {
        let { tokens } = Lexer.scan('@STOP');
        expect(tokens[0].kind).to.equal(TokenKind.AtStop);
    });
});
