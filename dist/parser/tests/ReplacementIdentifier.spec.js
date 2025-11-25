"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const Parser_1 = require("../Parser");
const Lexer_1 = require("../../lexer/Lexer");
const Expression_1 = require("../Expression");
const TokenKind_1 = require("../../lexer/TokenKind");
describe('ReplacementIdentifier', () => {
    it('supports resource replacement syntax', () => {
        const parser = Parser_1.Parser.parse(`
            sub main()
                print @{chromaIcons.STOP}
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.empty;
        const printStmt = parser.ast.statements[0]['func'].body.statements[0];
        (0, chai_config_spec_1.expect)(printStmt.expressions[0]).to.be.instanceof(Expression_1.LiteralExpression);
        (0, chai_config_spec_1.expect)(printStmt.expressions[0].token.kind).to.equal(TokenKind_1.TokenKind.ReplacementIdentifier);
        (0, chai_config_spec_1.expect)(printStmt.expressions[0].token.text).to.equal('@{chromaIcons.STOP}');
    });
    it('supports empty replacement identifier', () => {
        const parser = Parser_1.Parser.parse(`
            sub main()
                print @{}
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.empty;
        const printStmt = parser.ast.statements[0]['func'].body.statements[0];
        (0, chai_config_spec_1.expect)(printStmt.expressions[0].token.text).to.equal('@{}');
    });
    it('reports error for unterminated resource replacement', () => {
        const { diagnostics } = Lexer_1.Lexer.scan(`
            sub main()
                print @{chromaIcons.STOP
            end sub
        `);
        (0, chai_config_spec_1.expect)(diagnostics).to.not.be.empty;
        (0, chai_config_spec_1.expect)(diagnostics[0].message).to.equal('Unterminated replacement identifier');
    });
    it('does not crash on complex expressions', () => {
        const parser = Parser_1.Parser.parse(`
            sub main()
                print "value: " + @{some.value}
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.empty;
    });
    it('supports nested replacement identifiers', () => {
        const parser = Parser_1.Parser.parse(`
            sub main()
                print @{Script @{consts.REGISTRY_SECTION_PREFIX} + @{consts.env.reg.section}}
                print @{Script "<icon>" + @{icons.PRIVATE_BASELINE_ADJUSTED} + "</icon>"}
                print @{Script @{ui.detailsStatusInfo.height} / 2}
                print @{Script Max(@{ui.hub.posterHeight}, @{ui.hubs.rowLabelHeight})}
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.empty;
        const statements = parser.ast.statements[0]['func'].body.statements;
        (0, chai_config_spec_1.expect)(statements[0].expressions[0].token.text).to.equal('@{Script @{consts.REGISTRY_SECTION_PREFIX} + @{consts.env.reg.section}}');
        (0, chai_config_spec_1.expect)(statements[1].expressions[0].token.text).to.equal('@{Script "<icon>" + @{icons.PRIVATE_BASELINE_ADJUSTED} + "</icon>"}');
        (0, chai_config_spec_1.expect)(statements[2].expressions[0].token.text).to.equal('@{Script @{ui.detailsStatusInfo.height} / 2}');
        (0, chai_config_spec_1.expect)(statements[3].expressions[0].token.text).to.equal('@{Script Max(@{ui.hub.posterHeight}, @{ui.hubs.rowLabelHeight})}');
    });
});
//# sourceMappingURL=ReplacementIdentifier.spec.js.map