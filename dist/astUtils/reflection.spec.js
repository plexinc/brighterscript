"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-multi-spaces */
const chai_config_spec_1 = require("../chai-config.spec");
const Statement_1 = require("../parser/Statement");
const Expression_1 = require("../parser/Expression");
const TokenKind_1 = require("../lexer/TokenKind");
const reflection_1 = require("./reflection");
const creators_1 = require("./creators");
const Program_1 = require("../Program");
const BrsFile_1 = require("../files/BrsFile");
const XmlFile_1 = require("../files/XmlFile");
const __1 = require("..");
describe('reflection', () => {
    describe('Files', () => {
        it('recognizes files', () => {
            const program = new Program_1.Program({});
            const file = new BrsFile_1.BrsFile('path/to/source/file.brs', 'pkg:/source/file.brs', program);
            const comp = new XmlFile_1.XmlFile('path/to/components/file.xml', 'pkg:/components/file.brs', program);
            (0, chai_config_spec_1.expect)((0, reflection_1.isBrsFile)(file)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isXmlFile)(file)).to.be.false;
            (0, chai_config_spec_1.expect)((0, reflection_1.isBrsFile)(comp)).to.be.false;
            (0, chai_config_spec_1.expect)((0, reflection_1.isXmlFile)(comp)).to.be.true;
        });
    });
    describe('Statements', () => {
        const ident = (0, creators_1.createToken)(TokenKind_1.TokenKind.Identifier, 'a');
        const expr = (0, creators_1.createStringLiteral)('');
        const token = (0, creators_1.createToken)(TokenKind_1.TokenKind.StringLiteral, '');
        const body = new Statement_1.Body([]);
        const assignment = new Statement_1.AssignmentStatement(undefined, ident, expr);
        const block = new Statement_1.Block([]);
        const expression = new Statement_1.ExpressionStatement(expr);
        const comment = new Statement_1.CommentStatement([token]);
        const exitFor = new Statement_1.ExitForStatement({ exitFor: token });
        const exitWhile = new Statement_1.ExitWhileStatement({ exitWhile: token });
        const funs = new Statement_1.FunctionStatement(ident, new Expression_1.FunctionExpression([], block, token, token, token, token));
        const ifs = new Statement_1.IfStatement({ if: token }, expr, block);
        const increment = new Statement_1.IncrementStatement(expr, token);
        const print = new Statement_1.PrintStatement({ print: token }, []);
        const gotos = new Statement_1.GotoStatement({ goto: token, label: token });
        const labels = new Statement_1.LabelStatement({ identifier: ident, colon: token });
        const returns = new Statement_1.ReturnStatement({ return: token });
        const ends = new Statement_1.EndStatement({ end: token });
        const stop = new Statement_1.StopStatement({ stop: token });
        const fors = new Statement_1.ForStatement(token, assignment, token, expr, block, token, token, expr);
        const foreach = new Statement_1.ForEachStatement({ forEach: token, in: token, endFor: token }, token, expr, block);
        const whiles = new Statement_1.WhileStatement({ while: token, endWhile: token }, expr, block);
        const dottedSet = new Statement_1.DottedSetStatement(expr, ident, expr);
        const indexedSet = new Statement_1.IndexedSetStatement(expr, expr, expr, token, token);
        const library = new Statement_1.LibraryStatement({ library: token, filePath: token });
        const namespace = new Statement_1.NamespaceStatement(token, new Expression_1.NamespacedVariableNameExpression((0, __1.createVariableExpression)('a')), body, token);
        const cls = new Statement_1.ClassStatement(token, ident, [], token);
        const imports = new Statement_1.ImportStatement(token, token);
        const catchStmt = new Statement_1.CatchStatement({ catch: token }, ident, block);
        const tryCatch = new Statement_1.TryCatchStatement({ try: token }, block, catchStmt);
        const throwSt = new Statement_1.ThrowStatement((0, creators_1.createToken)(TokenKind_1.TokenKind.Throw));
        it('isStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isStatement)(library)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isStatement)((0, creators_1.createStringLiteral)('test'))).to.be.false;
            //doesn't fail for undefined
            (0, chai_config_spec_1.expect)((0, reflection_1.isStatement)(undefined)).to.be.false;
        });
        it('isBody', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isBody)(body)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isBody)(assignment)).to.be.false;
        });
        it('isAssignmentStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isAssignmentStatement)(assignment)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isAssignmentStatement)(body)).to.be.false;
        });
        it('isBlock', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isBlock)(block)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isBlock)(body)).to.be.false;
        });
        it('isExpressionStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpressionStatement)(expression)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpressionStatement)(body)).to.be.false;
        });
        it('isCommentStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isCommentStatement)(comment)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isCommentStatement)(body)).to.be.false;
        });
        it('isExitForStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isExitForStatement)(exitFor)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExitForStatement)(body)).to.be.false;
        });
        it('isExitWhileStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isExitWhileStatement)(exitWhile)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExitWhileStatement)(body)).to.be.false;
        });
        it('isFunctionStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isFunctionStatement)(funs)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isFunctionStatement)(body)).to.be.false;
        });
        it('isIfStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isIfStatement)(ifs)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isIfStatement)(body)).to.be.false;
        });
        it('isIncrementStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isIncrementStatement)(increment)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isIncrementStatement)(body)).to.be.false;
        });
        it('isPrintStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isPrintStatement)(print)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isPrintStatement)(body)).to.be.false;
        });
        it('isGotoStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isGotoStatement)(gotos)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isGotoStatement)(body)).to.be.false;
        });
        it('isLabelStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isLabelStatement)(labels)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isLabelStatement)(body)).to.be.false;
        });
        it('isReturnStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isReturnStatement)(returns)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isReturnStatement)(body)).to.be.false;
        });
        it('isEndStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isEndStatement)(ends)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isEndStatement)(body)).to.be.false;
        });
        it('isStopStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isStopStatement)(stop)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isStopStatement)(body)).to.be.false;
        });
        it('isForStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isForStatement)(fors)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isForStatement)(body)).to.be.false;
        });
        it('isForEachStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isForEachStatement)(foreach)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isForEachStatement)(body)).to.be.false;
        });
        it('isWhileStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isWhileStatement)(whiles)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isWhileStatement)(body)).to.be.false;
        });
        it('isDottedSetStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedSetStatement)(dottedSet)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedSetStatement)(body)).to.be.false;
        });
        it('isIndexedSetStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedSetStatement)(indexedSet)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedSetStatement)(body)).to.be.false;
        });
        it('isLibraryStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isLibraryStatement)(library)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isLibraryStatement)(body)).to.be.false;
        });
        it('isNamespaceStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isNamespaceStatement)(namespace)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isNamespaceStatement)(body)).to.be.false;
        });
        it('isClassStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(cls)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isClassStatement)(body)).to.be.false;
        });
        it('isImportStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isImportStatement)(imports)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isImportStatement)(body)).to.be.false;
        });
        it('isTryCatchStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isTryCatchStatement)(tryCatch)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isTryCatchStatement)(body)).to.be.false;
        });
        it('isCatchStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isCatchStatement)(catchStmt)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isCatchStatement)(body)).to.be.false;
        });
        it('isThrowStatement', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isThrowStatement)(throwSt)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isThrowStatement)(body)).to.be.false;
        });
    });
    describe('Expressions', () => {
        const ident = (0, creators_1.createToken)(TokenKind_1.TokenKind.Identifier, 'a');
        const expr = (0, creators_1.createStringLiteral)('');
        const token = (0, creators_1.createToken)(TokenKind_1.TokenKind.StringLiteral, '');
        const block = new Statement_1.Block([]);
        const charCode = {
            kind: TokenKind_1.TokenKind.EscapedCharCodeLiteral,
            text: '0',
            range: undefined,
            isReserved: false,
            charCode: 0,
            leadingWhitespace: ''
        };
        const nsVar = new Expression_1.NamespacedVariableNameExpression((0, __1.createVariableExpression)('a'));
        const binary = new Expression_1.BinaryExpression(expr, token, expr);
        const call = new Expression_1.CallExpression(expr, token, token, []);
        const fun = new Expression_1.FunctionExpression([], block, token, token, token, token);
        const dottedGet = new Expression_1.DottedGetExpression(expr, ident, token);
        const xmlAttrGet = new Expression_1.XmlAttributeGetExpression(expr, ident, token);
        const indexedGet = new Expression_1.IndexedGetExpression(expr, expr, token, token);
        const grouping = new Expression_1.GroupingExpression({ left: token, right: token }, expr);
        const literal = (0, creators_1.createStringLiteral)('test');
        const escapedCarCode = new Expression_1.EscapedCharCodeLiteralExpression(charCode);
        const arrayLit = new Expression_1.ArrayLiteralExpression([], token, token);
        const aaLit = new Expression_1.AALiteralExpression([], token, token);
        const unary = new Expression_1.UnaryExpression(token, expr);
        const variable = new Expression_1.VariableExpression(ident);
        const sourceLit = new Expression_1.SourceLiteralExpression(token);
        const newx = new Expression_1.NewExpression(token, call);
        const callfunc = new Expression_1.CallfuncExpression(expr, token, ident, token, [], token);
        const tplQuasi = new Expression_1.TemplateStringQuasiExpression([expr]);
        const tplString = new Expression_1.TemplateStringExpression(token, [tplQuasi], [], token);
        const taggedTpl = new Expression_1.TaggedTemplateStringExpression(ident, token, [tplQuasi], [], token);
        const annotation = new Expression_1.AnnotationExpression(token, token);
        it('isExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(binary)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(binary.operator)).to.be.false;
        });
        it('isBinaryExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isBinaryExpression)(binary)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isBinaryExpression)(fun)).to.be.false;
        });
        it('isCallExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isCallExpression)(call)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isCallExpression)(fun)).to.be.false;
        });
        it('isFunctionExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isFunctionExpression)(fun)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isFunctionExpression)(call)).to.be.false;
        });
        it('isNamespacedVariableNameExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isNamespacedVariableNameExpression)(nsVar)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isNamespacedVariableNameExpression)(fun)).to.be.false;
        });
        it('isDottedGetExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedGetExpression)(dottedGet)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isDottedGetExpression)(fun)).to.be.false;
        });
        it('iisXmlAttributeGetExpressions', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isXmlAttributeGetExpression)(xmlAttrGet)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isXmlAttributeGetExpression)(fun)).to.be.false;
        });
        it('isIndexedGetExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedGetExpression)(indexedGet)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isIndexedGetExpression)(fun)).to.be.false;
        });
        it('isGroupingExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isGroupingExpression)(grouping)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isGroupingExpression)(fun)).to.be.false;
        });
        it('isLiteralExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isLiteralExpression)(literal)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isLiteralExpression)(fun)).to.be.false;
        });
        it('isEscapedCharCodeLiteral', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isEscapedCharCodeLiteralExpression)(escapedCarCode)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isEscapedCharCodeLiteralExpression)(fun)).to.be.false;
        });
        it('isArrayLiteralExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isArrayLiteralExpression)(arrayLit)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isArrayLiteralExpression)(fun)).to.be.false;
        });
        it('isAALiteralExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isAALiteralExpression)(aaLit)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isAALiteralExpression)(fun)).to.be.false;
        });
        it('isUnaryExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isUnaryExpression)(unary)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isUnaryExpression)(fun)).to.be.false;
        });
        it('isVariableExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isVariableExpression)(variable)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isVariableExpression)(fun)).to.be.false;
        });
        it('isSourceLiteralExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isSourceLiteralExpression)(sourceLit)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isSourceLiteralExpression)(fun)).to.be.false;
        });
        it('isNewExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isNewExpression)(newx)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isNewExpression)(fun)).to.be.false;
        });
        it('isCallfuncExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isCallfuncExpression)(callfunc)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isCallfuncExpression)(fun)).to.be.false;
        });
        it('isTemplateStringQuasiExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isTemplateStringQuasiExpression)(tplQuasi)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isTemplateStringQuasiExpression)(fun)).to.be.false;
        });
        it('isTemplateStringExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isTemplateStringExpression)(tplString)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isTemplateStringExpression)(fun)).to.be.false;
        });
        it('isTaggedTemplateStringExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isTaggedTemplateStringExpression)(taggedTpl)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isTaggedTemplateStringExpression)(fun)).to.be.false;
        });
        it('isAnnotationExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isAnnotationExpression)(annotation)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isAnnotationExpression)(fun)).to.be.false;
        });
        it('isExpression', () => {
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(call)).to.be.true;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(new Statement_1.EmptyStatement())).to.be.false;
            //doesn't fail for invalid param types
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(undefined)).to.be.false;
            (0, chai_config_spec_1.expect)((0, reflection_1.isExpression)(1)).to.be.false;
        });
    });
});
//# sourceMappingURL=reflection.spec.js.map