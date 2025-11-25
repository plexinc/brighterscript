"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SymbolTable_1 = require("./SymbolTable");
const chai_config_spec_1 = require("./chai-config.spec");
const StringType_1 = require("./types/StringType");
const IntegerType_1 = require("./types/IntegerType");
const BooleanType_1 = require("./types/BooleanType");
describe('SymbolTable', () => {
    let parent;
    beforeEach(() => {
        parent = new SymbolTable_1.SymbolTable('Parent');
    });
    it('is case insensitive', () => {
        const st = new SymbolTable_1.SymbolTable('Child');
        st.addSymbol('foo', null, new StringType_1.StringType());
        (0, chai_config_spec_1.expect)(st.getSymbol('FOO').length).eq(1);
        (0, chai_config_spec_1.expect)(st.getSymbol('FOO')[0].type.toString()).eq('string');
    });
    it('stores all previous symbols', () => {
        const st = new SymbolTable_1.SymbolTable('Child');
        st.addSymbol('foo', null, new StringType_1.StringType());
        st.addSymbol('foo', null, new IntegerType_1.IntegerType());
        (0, chai_config_spec_1.expect)(st.getSymbol('FOO').length).eq(2);
    });
    it('reads from parent symbol table if not found in current', () => {
        const st = new SymbolTable_1.SymbolTable('Child', () => parent);
        parent.addSymbol('foo', null, new StringType_1.StringType());
        (0, chai_config_spec_1.expect)(st.getSymbol('foo')[0].type.toString()).eq('string');
    });
    it('reads from current table if it exists', () => {
        const st = new SymbolTable_1.SymbolTable('Child', () => parent);
        parent.addSymbol('foo', null, new StringType_1.StringType());
        st.addSymbol('foo', null, new IntegerType_1.IntegerType());
        (0, chai_config_spec_1.expect)(st.getSymbol('foo')[0].type.toString()).eq('integer');
    });
    it('correct checks if a symbol is in the table using hasSymbol', () => {
        const child = new SymbolTable_1.SymbolTable('Child', () => parent);
        parent.addSymbol('foo', null, new StringType_1.StringType());
        child.addSymbol('bar', null, new IntegerType_1.IntegerType());
        (0, chai_config_spec_1.expect)(parent.hasSymbol('foo')).to.be.true;
        (0, chai_config_spec_1.expect)(parent.hasSymbol('bar')).to.be.false;
        (0, chai_config_spec_1.expect)(child.hasSymbol('foo')).to.be.true;
        (0, chai_config_spec_1.expect)(child.hasSymbol('bar')).to.be.true;
        (0, chai_config_spec_1.expect)(child.hasSymbol('buz')).to.be.false;
    });
    describe('mergeSymbolTable', () => {
        it('adds each symbol to the table', () => {
            const st = new SymbolTable_1.SymbolTable('Child');
            st.addSymbol('foo', null, new StringType_1.StringType());
            const otherTable = new SymbolTable_1.SymbolTable('OtherTable');
            otherTable.addSymbol('bar', null, new IntegerType_1.IntegerType());
            otherTable.addSymbol('foo', null, new IntegerType_1.IntegerType());
            st.mergeSymbolTable(otherTable);
        });
    });
    it('searches siblings before parents', () => {
        parent.addSymbol('alpha', null, new StringType_1.StringType());
        const child = new SymbolTable_1.SymbolTable('Child', () => parent);
        const sibling = new SymbolTable_1.SymbolTable('Sibling');
        child.addSibling(sibling);
        sibling.addSymbol('alpha', null, new BooleanType_1.BooleanType());
        (0, chai_config_spec_1.expect)(child.getSymbol('alpha').map(x => x.type.toTypeString())).to.eql([
            'boolean'
        ]);
    });
});
//# sourceMappingURL=SymbolTable.spec.js.map