"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var server_1 = require("@simplewebauthn/server");
var handler = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var options;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                event.response.publicChallengeParameters = {};
                event.response.privateChallengeParameters = {};
                if (!(!event.request.session || !event.request.session.length)) return [3 /*break*/, 5];
                if (!hasRegisteredDevice(event)) return [3 /*break*/, 2];
                return [4 /*yield*/, generateDeviceAuthenticationOptions(event)];
            case 1:
                options = _a.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, generateDeviceRegistrationOptions(event)];
            case 3:
                options = _a.sent();
                _a.label = 4;
            case 4:
                event.response.publicChallengeParameters = {
                    options: JSON.stringify(options),
                    hasRegisteredDevice: "".concat(hasRegisteredDevice(event)),
                    email: event.request.userAttributes.email,
                };
                event.response.privateChallengeParameters = {
                    challenge: options.challenge,
                };
                _a.label = 5;
            case 5:
                // //TODO: testing
                // const devices = parseDevices(event);
                // //TODO: test GenerateAuthenticationOptionsOpts
                // const opts = {
                //   timeout: 60000,
                //   allowCredentials: devices.map((dev) => ({
                //     id: dev.credentialID,
                //     type: "public-key",
                //     transports: dev.transports,
                //   })),
                //   userVerification: "required",
                //   rpID: "localhost",
                // };
                // event.response.publicChallengeParameters = {
                //   options: JSON.stringify(options),
                //   // devices: JSON.stringify(devices), // testing
                //   // generateOpts: JSON.stringify(opts), // testing
                //   hasRegisteredDevice: `${hasRegisteredDevice(event)}`,
                //   email: event.request.userAttributes.email,
                // };
                // // NOTE: the private challenge parameters are passed along to the
                // // verify step and is not exposed to the caller
                // // need to pass the challenge along so we can verify the user's answer
                // event.response.privateChallengeParameters = {
                //   challenge: options.challenge,
                // };
                // TODO: remove this if possible
                // event.response.challengeMetadata = `CODE-${options.challenge}`;
                callback(null, event);
                return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
function generateDeviceAuthenticationOptions(event) {
    return __awaiter(this, void 0, void 0, function () {
        var devices, opts;
        return __generator(this, function (_a) {
            devices = parseDevices(event);
            opts = {
                timeout: 60000,
                allowCredentials: devices.map(function (dev) { return ({
                    id: dev.credentialID,
                    type: "public-key",
                    transports: dev.transports,
                }); }),
                userVerification: "required",
                rpID: "localhost",
            };
            return [2 /*return*/, (0, server_1.generateAuthenticationOptions)(opts)];
        });
    });
}
function generateDeviceRegistrationOptions(event) {
    return __awaiter(this, void 0, void 0, function () {
        var devices, opts;
        return __generator(this, function (_a) {
            devices = parseDevices(event);
            opts = {
                rpName: "SimpleWebAuthn Example",
                rpID: "localhost",
                userID: event.request.userAttributes.email,
                userName: event.request.userAttributes.email,
                timeout: 60000,
                attestationType: "none",
                /**
                 * Passing in a user's list of already-registered authenticator IDs here prevents users from
                 * registering the same device multiple times. The authenticator will simply throw an error in
                 * the browser if it's asked to perform registration when one of these ID's already resides
                 * on it.
                 */
                excludeCredentials: devices.map(function (dev) { return ({
                    id: dev.credentialID,
                    type: "public-key",
                    transports: dev.transports,
                }); }),
                authenticatorSelection: {
                    residentKey: "discouraged",
                },
                /**
                 * Support the two most common algorithms: ES256, and RS256
                 */
                supportedAlgorithmIDs: [-7, -257],
            };
            return [2 /*return*/, (0, server_1.generateRegistrationOptions)(opts)];
        });
    });
}
function hasRegisteredDevice(event) {
    var devices = parseDevices(event);
    return devices.length > 0;
}
function parseDevices(event) {
    var devicesString = event.request.userAttributes["custom:devices"];
    if (!devicesString)
        return [];
    var devices = JSON.parse(devicesString);
    return devices.map(function (device) { return ({
        credentialID: Buffer.from(device.credentialID),
        credentialPublicKey: Buffer.from(device.credentialPublicKey),
        counter: device.counter,
        transports: device.transports || [],
    }); });
}
//# sourceMappingURL=create-auth-challenge.js.map