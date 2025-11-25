"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../chai-config.spec");
const stackedVisitor_1 = require("./stackedVisitor");
describe('createStackedVisitor', () => {
    function visitStruct(struct, parent, visitor) {
        var _a;
        visitor(struct, parent);
        (_a = struct.children) === null || _a === void 0 ? void 0 : _a.forEach(s => visitStruct(s, struct, visitor));
    }
    const test1Struct = {
        id: 1,
        children: [
            { id: 2 },
            {
                id: 3, children: [
                    { id: 4 }
                ]
            },
            { id: 5 },
            {
                id: 6, children: [
                    {
                        id: 7, children: [
                            { id: 8 }
                        ]
                    }
                ]
            },
            { id: 9 }
        ]
    };
    it('visits a well-formed structure', () => {
        const actual = [];
        const stackedVisitor = (0, stackedVisitor_1.createStackedVisitor)((item, stack) => {
            (0, chai_config_spec_1.assert)(item !== undefined, 'item is undefined');
            (0, chai_config_spec_1.assert)(item.id !== undefined, 'item.id is undefined');
            (0, chai_config_spec_1.assert)(stack !== undefined, 'stack is undefined');
            actual.push(`${stack.length ? stack.map(e => e.id).join('/') + '/' : ''}${item.id}`);
        });
        visitStruct(test1Struct, undefined, stackedVisitor);
        (0, chai_config_spec_1.expect)(actual).to.deep.equal([
            '1',
            '1/2',
            '1/3',
            '1/3/4',
            '1/5',
            '1/6',
            '1/6/7',
            '1/6/7/8',
            '1/9'
        ]);
    });
    it('calls open/close when visiting the structure', () => {
        const actual = [];
        const stackedVisitor = (0, stackedVisitor_1.createStackedVisitor)(() => { }, (pushed, stack) => {
            (0, chai_config_spec_1.assert)(pushed !== undefined, 'pushed is undefined');
            (0, chai_config_spec_1.assert)(pushed.id !== undefined, 'pushed.id is undefined');
            (0, chai_config_spec_1.assert)(stack !== undefined, 'stack is undefined');
            actual.push(`>${stack.map(e => e.id).join('/')}:${pushed.id}`);
        }, (popped, stack) => {
            (0, chai_config_spec_1.assert)(popped !== undefined, 'popped is undefined');
            (0, chai_config_spec_1.assert)(popped.id !== undefined, 'popped.id is undefined');
            (0, chai_config_spec_1.assert)(stack !== undefined, 'stack is undefined');
            actual.push(`<${stack.map(e => e.id).join('/')}:${popped.id}`);
        });
        visitStruct(test1Struct, undefined, stackedVisitor);
        (0, chai_config_spec_1.expect)(actual).to.deep.equal([
            '>1:1',
            '>1/3:3',
            '<1:3',
            '>1/6:6',
            '>1/6/7:7',
            '<1/6:7',
            '<1:6'
        ]);
    });
});
//# sourceMappingURL=stackedVisitor.spec.js.map