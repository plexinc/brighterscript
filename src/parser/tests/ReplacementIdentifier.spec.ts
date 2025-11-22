
import { expect } from '../../chai-config.spec';
import { Parser } from '../Parser';
import { Lexer } from '../../lexer/Lexer';
import { LiteralExpression } from '../Expression';
import { TokenKind } from '../../lexer/TokenKind';

describe('ReplacementIdentifier', () => {
    it('supports resource replacement syntax', () => {
        const parser = Parser.parse(`
            sub main()
                print @{chromaIcons.STOP}
            end sub
        `);
        expect(parser.diagnostics).to.be.empty;
        const printStmt = parser.ast.statements[0]['func'].body.statements[0];
        expect(printStmt.expressions[0]).to.be.instanceof(LiteralExpression);
        expect(printStmt.expressions[0].token.kind).to.equal(TokenKind.ReplacementIdentifier);
        expect(printStmt.expressions[0].token.text).to.equal('@{chromaIcons.STOP}');
    });

    it('supports empty replacement identifier', () => {
        const parser = Parser.parse(`
            sub main()
                print @{}
            end sub
        `);
        expect(parser.diagnostics).to.be.empty;
        const printStmt = parser.ast.statements[0]['func'].body.statements[0];
        expect(printStmt.expressions[0].token.text).to.equal('@{}');
    });

    it('reports error for unterminated resource replacement', () => {
        const { diagnostics } = Lexer.scan(`
            sub main()
                print @{chromaIcons.STOP
            end sub
        `);
        expect(diagnostics).to.not.be.empty;
        expect(diagnostics[0].message).to.equal('Unterminated replacement identifier');
    });

    it('does not crash on complex expressions', () => {
        const parser = Parser.parse(`
            sub main()
                print "value: " + @{some.value}
            end sub
        `);
        expect(parser.diagnostics).to.be.empty;
    });

    it('supports nested replacement identifiers', () => {
        const parser = Parser.parse(`
            sub main()
                print @{Script @{consts.REGISTRY_SECTION_PREFIX} + @{consts.env.reg.section}}
                print @{Script "<icon>" + @{icons.PRIVATE_BASELINE_ADJUSTED} + "</icon>"}
                print @{Script @{ui.detailsStatusInfo.height} / 2}
                print @{Script Max(@{ui.hub.posterHeight}, @{ui.hubs.rowLabelHeight})}
            end sub
        `);
        expect(parser.diagnostics).to.be.empty;
        const statements = parser.ast.statements[0]['func'].body.statements;
        expect(statements[0].expressions[0].token.text).to.equal('@{Script @{consts.REGISTRY_SECTION_PREFIX} + @{consts.env.reg.section}}');
        expect(statements[1].expressions[0].token.text).to.equal('@{Script "<icon>" + @{icons.PRIVATE_BASELINE_ADJUSTED} + "</icon>"}');
        expect(statements[2].expressions[0].token.text).to.equal('@{Script @{ui.detailsStatusInfo.height} / 2}');
        expect(statements[3].expressions[0].token.text).to.equal('@{Script Max(@{ui.hub.posterHeight}, @{ui.hubs.rowLabelHeight})}');
    });
});
