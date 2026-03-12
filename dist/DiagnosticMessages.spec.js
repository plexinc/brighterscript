"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const DiagnosticMessages_1 = require("./DiagnosticMessages");
describe('DiagnosticMessages', () => {
    it('has unique code for each message', () => {
        let codes = {};
        for (let key in DiagnosticMessages_1.DiagnosticMessages) {
            let func = DiagnosticMessages_1.DiagnosticMessages[key];
            let obj = func('', '', '', '', '', '', '', '', '');
            //if another message already has this code
            if (!codes[obj.code]) {
                codes[obj.code] = key;
            }
            else {
                (0, chai_config_spec_1.expect)(codes[obj.code]).to.equal(key, 'Two diagnostic messages share the same error code');
            }
        }
    });
});
//# sourceMappingURL=DiagnosticMessages.spec.js.map