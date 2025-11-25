"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
const chai_config_spec_1 = require("./chai-config.spec");
const sinon = require("sinon");
const PluginInterface_1 = require("./PluginInterface");
const logging_1 = require("./logging");
describe('PluginInterface', () => {
    let pluginInterface;
    beforeEach(() => {
        pluginInterface = new PluginInterface_1.default([], { logger: (0, logging_1.createLogger)() });
    });
    it('allows adding a plugin', () => {
        const beforePublish = sinon.spy();
        const plugin = {
            name: 'allows adding a plugin',
            beforePublish: beforePublish
        };
        //@ts-ignore the current definition of `emit` doesn't like this third argument
        pluginInterface.emit('beforePublish', undefined, []);
        pluginInterface.add(plugin);
        //@ts-ignore the current definition of `emit` doesn't like this third argument
        pluginInterface.emit('beforePublish', undefined, []);
        (0, chai_config_spec_1.expect)(beforePublish.callCount).to.equal(1);
    });
    it('allows testing whether a plugin is registered', () => {
        const plugin = {
            name: 'allows testing whether a plugin is registered'
        };
        (0, chai_config_spec_1.expect)(pluginInterface.has(plugin)).to.be.false;
        pluginInterface.add(plugin);
        (0, chai_config_spec_1.expect)(pluginInterface.has(plugin)).to.be.true;
    });
    it('does not allows adding a plugin multiple times', () => {
        const beforePublish = sinon.spy();
        const plugin = {
            name: 'does not allows adding a plugin multiple times',
            beforePublish: beforePublish
        };
        pluginInterface.add(plugin);
        pluginInterface.add(plugin);
        //@ts-ignore the current definition of `emit` doesn't like this third argument
        pluginInterface.emit('beforePublish', undefined, []);
        (0, chai_config_spec_1.expect)(beforePublish.callCount).to.equal(1);
        pluginInterface.remove(plugin);
        (0, chai_config_spec_1.expect)(pluginInterface.has(plugin)).to.be.false;
    });
    it('allows removing a plugin', () => {
        const beforePublish = sinon.spy();
        const plugin = {
            name: 'allows removing a plugin',
            beforePublish: beforePublish
        };
        pluginInterface.add(plugin);
        //@ts-ignore the current definition of `emit` doesn't like this third argument
        pluginInterface.emit('beforePublish', undefined, []);
        (0, chai_config_spec_1.expect)(beforePublish.callCount).to.equal(1);
        pluginInterface.remove(plugin);
        //@ts-ignore the current definition of `emit` doesn't like this third argument
        pluginInterface.emit('beforePublish', undefined, []);
        (0, chai_config_spec_1.expect)(beforePublish.callCount).to.equal(1);
    });
});
//# sourceMappingURL=PluginInterface.spec.js.map