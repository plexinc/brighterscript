"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DependencyGraph_1 = require("./DependencyGraph");
const sinon = require("sinon");
const chai_config_spec_1 = require("./chai-config.spec");
describe('DependencyGraph', () => {
    let graph;
    let onchange;
    beforeEach(() => {
        onchange = sinon.stub();
        graph = new DependencyGraph_1.DependencyGraph();
    });
    it('does not notify unrelated listeners', () => {
        graph.addOrReplace('a', ['b']);
        graph.addOrReplace('a', ['c']);
        let mockA = sinon.mock();
        let mockB = sinon.mock();
        graph.onchange('a', mockA);
        graph.onchange('b', mockB);
        graph.addOrReplace('c');
        (0, chai_config_spec_1.expect)(mockA.callCount).to.equal(1);
        (0, chai_config_spec_1.expect)(mockB.callCount).to.equal(0);
    });
    it('supports subscribing to item before it exists', () => {
        graph.onchange('a', onchange);
        graph.addOrReplace('a');
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(1);
    });
    it('supports subscribing to item after it exists', () => {
        graph.addOrReplace('a', ['b']);
        graph.onchange('a', onchange);
        graph.addOrReplace('a', ['c']);
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(1);
    });
    it('notifies grandparent of grandchild changes', () => {
        graph.onchange('a', onchange);
        graph.addOrReplace('a', ['b']);
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(1);
        graph.addOrReplace('b', ['c']);
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(2);
        graph.addOrReplace('c', ['d']);
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(3);
        graph.addOrReplace('c', ['e']);
        (0, chai_config_spec_1.expect)(onchange.callCount).to.equal(4);
    });
    it('updates allDependencies list when dependency changes', () => {
        graph.addOrReplace('a', ['b']);
        graph.addOrReplace('b', ['c']);
        (0, chai_config_spec_1.expect)(graph.nodes['a'].getAllDependencies().sort()).to.eql(['b', 'c']);
        graph.addOrReplace('b', ['d', 'e']);
        (0, chai_config_spec_1.expect)(graph.nodes['a'].getAllDependencies().sort()).to.eql(['b', 'd', 'e']);
    });
    describe('addOrReplace', () => {
        it('addOrReplace calls node.dispose()', () => {
            graph.addOrReplace('a', ['b']);
            const dispose = sinon.stub(graph.nodes['a'], 'dispose');
            graph.addOrReplace('a');
            (0, chai_config_spec_1.expect)(dispose.called).to.be.true;
        });
    });
    describe('remove', () => {
        it('notifies parents', () => {
            graph.addOrReplace('a', ['b']);
            graph.addOrReplace('b', ['c']);
            (0, chai_config_spec_1.expect)(graph.nodes['a'].getAllDependencies().sort()).to.eql(['b', 'c']);
            graph.remove('b');
            (0, chai_config_spec_1.expect)(graph.nodes['a'].getAllDependencies().sort()).to.eql(['b']);
        });
        it('calls node.dispose()', () => {
            graph.addOrReplace('a', ['b']);
            const dispose = sinon.stub(graph.nodes['a'], 'dispose');
            graph.remove('a');
            (0, chai_config_spec_1.expect)(dispose.called).to.be.true;
        });
    });
    describe('addDependency', () => {
        it('adds a new node when it does not exist', () => {
            (0, chai_config_spec_1.expect)(graph.nodes['a']).not.to.exist;
            graph.addDependency('a', 'b');
            (0, chai_config_spec_1.expect)(graph.nodes['a']).to.exist;
        });
        it('adds a new entry', () => {
            graph.addOrReplace('a');
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql([]);
            graph.addDependency('a', 'b');
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql(['b']);
            //doesn't double-add
            graph.addDependency('a', 'b');
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql(['b']);
        });
        it('calls node.dispose()', () => {
            graph.addOrReplace('a', ['b']);
            const dispose = sinon.stub(graph.nodes['a'], 'dispose');
            graph.addDependency('a', 'c');
            (0, chai_config_spec_1.expect)(dispose.called).to.be.true;
        });
    });
    describe('removeDependency', () => {
        it('does not throw when node does not exist', () => {
            graph.removeDependency('a', 'b');
            //did not throw, test passes!
        });
        it('removes dependency', () => {
            graph.addOrReplace('a', ['b']);
            (0, chai_config_spec_1.expect)(graph.nodes['a'].dependencies).to.eql([
                'b'
            ]);
            graph.removeDependency('a', 'b');
            (0, chai_config_spec_1.expect)(graph.nodes['a'].dependencies).to.be.empty;
        });
        it('calls node.dispose()', () => {
            graph.addOrReplace('a', ['b']);
            const dispose = sinon.stub(graph.nodes['a'], 'dispose');
            graph.removeDependency('a', 'b');
            (0, chai_config_spec_1.expect)(dispose.called).to.be.true;
        });
    });
    describe('getAllDependencies', () => {
        it('does not throw and returns empty array when node does not exist', () => {
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql([]);
        });
        it('returns empty list for known dependency', () => {
            graph.addOrReplace('a', []);
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql([]);
        });
        it('returns dependencies', () => {
            graph.addOrReplace('a', ['b']);
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a')).to.eql([
                'b'
            ]);
        });
        it('does not return duplicate dependencies', () => {
            graph.addOrReplace('a', ['b', 'c']);
            graph.addOrReplace('b', ['c']);
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a').sort()).to.eql([
                'b',
                'c'
            ]);
        });
        it('skips dependencies and their descendent dependencies', () => {
            graph.addOrReplace('a', ['b', 'c']);
            graph.addOrReplace('b', ['d', 'e']);
            graph.addOrReplace('c', ['f', 'g']);
            (0, chai_config_spec_1.expect)(graph.getAllDependencies('a', ['c']).sort()).to.eql([
                'b',
                'd',
                'e'
            ]);
        });
        it('works with multiple keys', () => {
            graph.addOrReplace('a', ['b', 'c']);
            graph.addOrReplace('b', ['c', 'd']);
            (0, chai_config_spec_1.expect)(graph.getAllDependencies(['a', 'b']).sort()).to.eql([
                'b', 'c', 'd'
            ]);
        });
    });
    describe('onchange', () => {
        it('emits when nodes are changed', () => {
            let mock = sinon.mock();
            graph.onchange('a', mock);
            graph.addOrReplace('a');
            (0, chai_config_spec_1.expect)(mock.callCount).to.equal(1);
        });
        it('does not cause infinite loop on circular dependency', () => {
            //direct
            graph.addOrReplace('a', ['b']);
            graph.addOrReplace('b', ['a']);
            //indirect
            graph.addOrReplace('c', ['d']);
            graph.addOrReplace('d', ['e']);
            graph.addOrReplace('e', ['c']);
        });
    });
    describe('dispose', () => {
        it('does not throw', () => {
            graph.addOrReplace('a');
            graph.dispose();
            //did not throw...test passes
        });
    });
});
//# sourceMappingURL=DependencyGraph.spec.js.map