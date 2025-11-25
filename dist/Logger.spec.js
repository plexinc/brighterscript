"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const logging_1 = require("./logging");
const chalk_1 = require("chalk");
const sinon_1 = require("sinon");
const sinon = (0, sinon_1.createSandbox)();
describe('Logger', () => {
    let logger;
    beforeEach(() => {
        logger = (0, logging_1.createLogger)({
            logLevel: 'trace'
        });
        sinon.restore();
        //disable chalk colors for testing
        sinon.stub(chalk_1.default, 'grey').callsFake((arg) => arg);
    });
    it('loglevel setter converts string to enum', () => {
        logger.logLevel = 'error';
        (0, chai_config_spec_1.expect)(logger.logLevel).to.eql('error');
        logger.logLevel = 'info';
        (0, chai_config_spec_1.expect)(logger.logLevel).to.eql('info');
    });
    it('uses "log" by default', () => {
        logger = (0, logging_1.createLogger)();
        (0, chai_config_spec_1.expect)(logger.logLevel).to.eql('log');
    });
    describe('log methods call correct error type', () => {
        it('error', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.error();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('error');
        });
        it('warn', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.warn();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('warn');
        });
        it('log', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.log();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('log');
        });
        it('info', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.info();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('info');
        });
        it('debug', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.debug();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('debug');
        });
        it('trace', () => {
            const stub = sinon.stub(logger, 'write').callsFake(() => { });
            logger.trace();
            (0, chai_config_spec_1.expect)(stub.getCalls()[0].args[0]).to.eql('trace');
        });
    });
    it('skips all errors on error level', () => {
        let messages = [];
        logger.subscribe((message) => {
            messages.push(message);
        });
        logger.logLevel = 'off';
        logger.trace();
        logger.debug();
        logger.info();
        logger.log();
        logger.warn();
        logger.error();
        (0, chai_config_spec_1.expect)(messages).to.eql([]);
    });
    it('does not skip when log level is high enough', () => {
        logger.logLevel = 'trace';
        const stub = sinon.stub(logger, 'write').callsFake(() => { });
        logger.trace();
        logger.debug();
        logger.info();
        logger.log();
        logger.warn();
        logger.error();
        (0, chai_config_spec_1.expect)(stub.getCalls().map(x => x.args[0])).to.eql([
            'trace',
            'debug',
            'info',
            'log',
            'warn',
            'error'
        ]);
    });
    describe('time', () => {
        it('calls action even if logLevel is wrong', () => {
            logger.logLevel = 'error';
            const spy = sinon.spy();
            logger.time('info', [], spy);
            (0, chai_config_spec_1.expect)(spy.called).to.be.true;
        });
        it('runs timer when loglevel is right', () => {
            logger.logLevel = 'log';
            const spy = sinon.spy();
            logger.time('log', [], spy);
            (0, chai_config_spec_1.expect)(spy.called).to.be.true;
        });
        it('returns value', () => {
            logger.logLevel = 'log';
            const spy = sinon.spy(() => {
                return true;
            });
            (0, chai_config_spec_1.expect)(logger.time('log', [], spy)).to.be.true;
            (0, chai_config_spec_1.expect)(spy.called).to.be.true;
        });
        it('gives callable pause and resume functions even when not running timer', () => {
            logger.time('info', [], (pause, resume) => {
                pause();
                resume();
            });
        });
        it('waits for and returns a promise when a promise is returned from the action', () => {
            (0, chai_config_spec_1.expect)(logger.time('info', ['message'], () => {
                return Promise.resolve();
            })).to.be.instanceof(Promise);
        });
    });
});
//# sourceMappingURL=Logger.spec.js.map