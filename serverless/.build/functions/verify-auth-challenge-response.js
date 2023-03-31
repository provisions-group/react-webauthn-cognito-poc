"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var helpers_1 = require("@simplewebauthn/server/helpers");
var client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
var handler = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var body, expectedAnswer, port, devices, device, opts, verification, opts, verification;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                body = JSON.parse(event.request.challengeAnswer);
                expectedAnswer = (_b = (_a = event === null || event === void 0 ? void 0 : event.request) === null || _a === void 0 ? void 0 : _a.privateChallengeParameters) === null || _b === void 0 ? void 0 : _b.challenge;
                port = 5173;
                if (!hasRegisteredDevice(event)) return [3 /*break*/, 2];
                devices = parseDevices(event);
                device = devices[0];
                opts = {
                    response: body,
                    expectedChallenge: "".concat(expectedAnswer),
                    expectedOrigin: "http://localhost:".concat(port),
                    expectedRPID: "localhost",
                    authenticator: device,
                    requireUserVerification: true,
                };
                return [4 /*yield*/, (0, server_1.verifyAuthenticationResponse)(opts)];
            case 1:
                verification = _c.sent();
                // update device
                if (verification.verified) {
                    event.response.answerCorrect = true;
                    updateUserDevice(event, verification);
                }
                else {
                    event.response.answerCorrect = false;
                }
                return [3 /*break*/, 6];
            case 2:
                opts = {
                    response: body,
                    expectedChallenge: "".concat(expectedAnswer),
                    expectedOrigin: "http://localhost:".concat(port),
                    expectedRPID: "localhost",
                    requireUserVerification: true,
                };
                return [4 /*yield*/, (0, server_1.verifyRegistrationResponse)(opts)];
            case 3:
                verification = _c.sent();
                if (!verification.verified) return [3 /*break*/, 5];
                event.response.answerCorrect = true;
                return [4 /*yield*/, addDeviceToUser(event, verification)];
            case 4:
                _c.sent();
                return [3 /*break*/, 6];
            case 5:
                event.response.answerCorrect = false;
                _c.label = 6;
            case 6:
                callback(null, event);
                return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
function updateUserDevice(event, verification) {
    return __awaiter(this, void 0, void 0, function () {
        var newCounter, devices, existingDevice, device;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!verification.authenticationInfo)
                        return [2 /*return*/];
                    newCounter = verification.authenticationInfo.newCounter;
                    devices = parseDevices(event);
                    existingDevice = devices[0];
                    device = __assign(__assign({}, existingDevice), { counter: newCounter });
                    // currently only saving one device.  overwriting previous values
                    return [4 /*yield*/, adminUpdateUserAttributes(event.userPoolId, event.userName, [device])];
                case 1:
                    // currently only saving one device.  overwriting previous values
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function addDeviceToUser(event, verification) {
    return __awaiter(this, void 0, void 0, function () {
        var body, _a, credentialPublicKey, credentialID, counter, devices, existingDevice, newDevice;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!verification.registrationInfo)
                        return [2 /*return*/];
                    body = JSON.parse(event.request.challengeAnswer);
                    _a = verification.registrationInfo, credentialPublicKey = _a.credentialPublicKey, credentialID = _a.credentialID, counter = _a.counter;
                    devices = parseDevices(event);
                    existingDevice = devices.find(function (device) {
                        return helpers_1.isoUint8Array.areEqual(device.credentialID, credentialID);
                    });
                    if (!!existingDevice) return [3 /*break*/, 2];
                    newDevice = {
                        credentialPublicKey: credentialPublicKey || Buffer.from(""),
                        credentialID: credentialID || Buffer.from(""),
                        counter: counter || 0,
                        transports: body.response.transports,
                    };
                    // currently only saving one device.  overwriting previous values
                    return [4 /*yield*/, adminUpdateUserAttributes(event.userPoolId, event.userName, [
                            newDevice,
                        ])];
                case 1:
                    // currently only saving one device.  overwriting previous values
                    _b.sent();
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function adminUpdateUserAttributes(userPoolId, username, devices) {
    return __awaiter(this, void 0, void 0, function () {
        var client, input, command, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: "us-east-2" });
                    input = {
                        // AdminUpdateUserAttributesRequest
                        UserPoolId: userPoolId,
                        Username: username,
                        UserAttributes: [
                            // AttributeListType // required
                            {
                                // AttributeType
                                Name: "custom:devices",
                                Value: JSON.stringify(devices),
                            },
                        ],
                    };
                    command = new client_cognito_identity_provider_1.AdminUpdateUserAttributesCommand(input);
                    return [4 /*yield*/, client.send(command)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
            }
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
//# sourceMappingURL=verify-auth-challenge-response.js.map