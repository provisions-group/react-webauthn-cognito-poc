"use strict";
// const _ = require('lodash')
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var _ = require("lodash");
var handler = function (event, context, callback) {
    var lastAttempt = _.last(event.request.session);
    if (event.request.session.length &&
        lastAttempt &&
        lastAttempt.challengeName === "CUSTOM_CHALLENGE" &&
        lastAttempt.challengeResult === true) {
        // Authenticator validated
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    }
    else if (!event.request.session.length) {
        // Initial auth request, start custom challenge flow
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = "CUSTOM_CHALLENGE";
    }
    else {
        // Authenticator failed the attestation or assertion challenges
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }
    callback(null, event);
};
exports.handler = handler;
//# sourceMappingURL=define-auth-challenge.js.map