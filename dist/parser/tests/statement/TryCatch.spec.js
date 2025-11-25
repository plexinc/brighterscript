"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../../chai-config.spec");
const Parser_1 = require("../../Parser");
const Statement_1 = require("../../Statement");
describe('parser try/catch', () => {
    it('can parse try catch statements', () => {
        var _a, _b, _c, _d;
        const parser = Parser_1.Parser.parse(`
            sub new()
                try
                    print "hello"
                catch e
                    print "error"
                end try
            end sub
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        const stmt = parser.references.functionExpressions[0].body.statements[0];
        (0, chai_config_spec_1.expect)(stmt).to.be.instanceof(Statement_1.TryCatchStatement);
        (0, chai_config_spec_1.expect)((_b = stmt.tokens.try) === null || _b === void 0 ? void 0 : _b.text).to.eql('try');
        (0, chai_config_spec_1.expect)(stmt.tryBranch).to.exist.and.ownProperty('statements').to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)(stmt.catchStatement).to.exist;
        const cstmt = stmt.catchStatement;
        (0, chai_config_spec_1.expect)((_c = cstmt.tokens.catch) === null || _c === void 0 ? void 0 : _c.text).to.eql('catch');
        (0, chai_config_spec_1.expect)(cstmt.exceptionVariable.text).to.eql('e');
        (0, chai_config_spec_1.expect)(cstmt.catchBranch).to.exist.and.ownProperty('statements').to.be.lengthOf(1);
        (0, chai_config_spec_1.expect)((_d = stmt.tokens.endTry) === null || _d === void 0 ? void 0 : _d.text).to.eql('end try');
    });
    it('supports various configurations of try-catch', () => {
        function expectNoParseErrors(text) {
            var _a;
            const parser = Parser_1.Parser.parse(`
                sub main()
                    ${text}
                end sub
            `);
            (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
        }
        expectNoParseErrors(`
            try : print a.b.c : catch e : print "error" :  end try
        `);
        //multiple statements
        expectNoParseErrors(`
            try : print "one" : print "two" : catch e : print "error" : end try
        `);
        expectNoParseErrors(`
            try : print a.b.c
            catch e : print "error" :  end try
        `);
        expectNoParseErrors(`
            try
                print a.b.c
            catch e : print "error" :  end try
        `);
        expectNoParseErrors(`
            try
                print a.b.c
            catch e
                print "error" :  end try
        `);
        expectNoParseErrors(`
            try: print a.b.c
            catch e
                print "error" :  end try
        `);
        expectNoParseErrors(`
            try: print a.b.c :  catch e
            print "error" :  end try
        `);
        expectNoParseErrors(`
            try: print a.b.c :  catch e : print "error"
            end try
        `);
        expectNoParseErrors(`
            try
            : print a.b.c : catch e : print "error" : end try
        `);
        expectNoParseErrors(`
            try : print a.b.c
            : catch e : print "error" : end try
        `);
        expectNoParseErrors(`
            try : print a.b.c
            : catch e
            : print "error" : end try
        `);
        expectNoParseErrors(`
            try
            : print a.b.c
            : catch e
            : print "error"
            : end try
        `);
    });
    it('recovers gracefully with syntax errors', () => {
        var _a;
        const parser = Parser_1.Parser.parse(`
            sub new()
                try
                    print "hello"
                catch e
                    print "error"
                end try
            end sub
        `);
        (0, chai_config_spec_1.expect)((_a = parser.diagnostics[0]) === null || _a === void 0 ? void 0 : _a.message).not.to.exist;
    });
    it('recovers from missing end-try when reaching function boundary', () => {
        const parser = Parser_1.Parser.parse(`
            sub new()
                try
                    print "hello"
                catch e
                    print "error"
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(1);
    });
    it('recovers from missing catch', () => {
        const parser = Parser_1.Parser.parse(`
            sub new()
                try
                    print "hello"
                    print "error"
                end try
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(1);
    });
    it('recovers from missing catch and end-try when reaching function boundary', () => {
        const parser = Parser_1.Parser.parse(`
            sub new()
                try
                    print "hello"
                    print "error"
            end sub
        `);
        (0, chai_config_spec_1.expect)(parser.diagnostics).to.be.lengthOf(1);
    });
});
//# sourceMappingURL=TryCatch.spec.js.map