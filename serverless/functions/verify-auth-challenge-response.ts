import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Authenticator, CognitoVerifyAuthEvent } from "../local-types";
import { Callback, Context } from "aws-lambda";
import { Buffer } from "buffer";
import base64 from "@hexagon/base64";

export const handler = async (
  event: CognitoVerifyAuthEvent,
  context: Context,
  callback: Callback
) => {
  // RegistrationResponseJSON
  const body = JSON.parse(event.request.challengeAnswer);
  const expectedAnswer = event?.request?.privateChallengeParameters?.challenge;
  const port = 5173;

  if (hasRegisteredDevice(event)) {
    const devices = parseDevices(event);
    // currently only allowing one device
    const device = devices[0];

    // transform device to one with arraybuffer

    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: `http://localhost:${port}`,
      expectedRPID: "localhost",
      authenticator: device,
      requireUserVerification: true,
    };

    const verification: VerifiedAuthenticationResponse =
      await verifyAuthenticationResponse(opts);

    // update device
    if (verification.verified) {
      event.response.answerCorrect = true;
      updateUserDevice(event, verification);
    } else {
      event.response.answerCorrect = false;
    }
  } else {
    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: `http://localhost:${port}`,
      expectedRPID: "localhost",
      requireUserVerification: true,
    };

    const verification: VerifiedRegistrationResponse =
      await verifyRegistrationResponse(opts);

    if (verification.verified) {
      event.response.answerCorrect = true;
      await addDeviceToUser(event, verification);
    } else {
      event.response.answerCorrect = false;
    }
  }

  callback(null, event);
};

async function updateUserDevice(
  event: CognitoVerifyAuthEvent,
  verification: VerifiedAuthenticationResponse
) {
  if (!verification.authenticationInfo) return;
  const { newCounter } = verification.authenticationInfo;
  const devices = parseDevices(event);

  // only using one device.
  const existingDevice = devices[0];

  existingDevice.id = coerceToBase64Url(existingDevice.id, "id");
  existingDevice.credentialID = coerceToBase64Url(
    existingDevice.credentialID,
    "credentialID"
  );
  existingDevice.credentialPublicKey = coerceToBase64Url(
    existingDevice.credentialPublicKey,
    "credentialPublicKey"
  );

  // const existingDevice = devices.find((device) =>
  //   isoUint8Array.areEqual(device.credentialID, credentialID)
  // );

  const device = { ...existingDevice, counter: newCounter };

  // currently only saving one device.  overwriting previous values
  await adminUpdateUserAttributes(event.userPoolId, event.userName, [device]);
}

async function addDeviceToUser(
  event: CognitoVerifyAuthEvent,
  verification: VerifiedRegistrationResponse
) {
  if (!verification.registrationInfo) return;

  const body = JSON.parse(event.request.challengeAnswer);

  const { credentialPublicKey, credentialID, counter } =
    verification.registrationInfo;

  const devices = parseDevices(event);

  const existingDevice = devices.find((device) =>
    isoUint8Array.areEqual(device.credentialID, credentialID)
  );

  if (!existingDevice) {
    /**
     * Add the returned device to the user's list of devices
     */
    // AuthenticatorDevice
    const newDevice: Authenticator = {
      id: coerceToBase64Url(credentialID, "id"),
      type: "public-key",
      credentialPublicKey: coerceToBase64Url(
        credentialPublicKey,
        "credentialPublicKey"
      ),
      credentialID: coerceToBase64Url(credentialID, "credentialID"),
      counter: counter || 0,
      transports: body.response.transports,
    };
    // const newDevice: Authenticator = {
    //   id: credentialID,
    //   type: "public-key",
    //   credentialPublicKey: credentialPublicKey || Buffer.from(""),
    //   credentialID: credentialID || Buffer.from(""),
    //   counter: counter || 0,
    //   transports: body.response.transports,
    // };

    // currently only saving one device.  overwriting previous values
    await adminUpdateUserAttributes(event.userPoolId, event.userName, [
      newDevice,
    ]);
  }
}

async function adminUpdateUserAttributes(
  userPoolId: string,
  username: string,
  devices: Authenticator[]
) {
  const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

  const input = {
    // AdminUpdateUserAttributesRequest
    UserPoolId: userPoolId, // required
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
  const command = new AdminUpdateUserAttributesCommand(input);

  const response = await client.send(command);

  return response;
}

function hasRegisteredDevice(event: CognitoVerifyAuthEvent) {
  const devices = parseDevices(event);
  return devices.length > 0;
}

// function parseDevices(event: CognitoVerifyAuthEvent): Authenticator[] {
//   const devicesString = event.request.userAttributes["custom:devices"];
//   if (!devicesString) return [];

//   const devices: Authenticator[] = JSON.parse(devicesString);

//   return devices.map((device) => ({
//     id: Buffer.from(device.credentialID),
//     type: "public-key",
//     credentialID: Buffer.from(device.credentialID), // JSON.parse does not recursively resolve ArrayBuffers
//     credentialPublicKey: Buffer.from(device.credentialPublicKey), // JSON.parse does not recursively resolve ArrayBuffers
//     counter: device.counter,
//     transports: device.transports || [],
//   }));
// }

function parseDevices(event: CognitoVerifyAuthEvent): Authenticator[] {
  const devicesString = event.request.userAttributes["custom:devices"];
  if (!devicesString) return [];

  const devices: Authenticator[] = JSON.parse(devicesString);

  return devices.map((device) => ({
    id: coerceToUint8Array(device.credentialID, "id"),
    type: "public-key",
    credentialID: coerceToUint8Array(device.credentialID, "id"), // JSON.parse does not recursively resolve ArrayBuffers
    credentialPublicKey: coerceToUint8Array(device.credentialPublicKey, "key"), // JSON.parse does not recursively resolve ArrayBuffers
    counter: device.counter,
    transports: device.transports || [],
  }));
}

//TODO: you are here

function coerceToUint8Array(buf, name) {
  const arrayBuf = coerceToArrayBuffer(buf, name);
  return new Uint8Array(arrayBuf);
}

function coerceToArrayBuffer(buf, name) {
  if (!name) {
    throw new TypeError("name not specified in coerceToArrayBuffer");
  }

  // Handle empty strings
  if (typeof buf === "string" && buf === "") {
    buf = new Uint8Array(0);

    // Handle base64url and base64 strings
  } else if (typeof buf === "string") {
    // base64 to base64url
    buf = buf.replace(/\+/g, "-").replace(/\//g, "_").replace("=", "");
    // base64 to Buffer
    buf = base64.toArrayBuffer(buf, true);
  }

  // Extract typed array from Array
  if (Array.isArray(buf)) {
    buf = new Uint8Array(buf);
  }

  // Extract ArrayBuffer from Node buffer
  if (typeof Buffer !== "undefined" && buf instanceof Buffer) {
    buf = new Uint8Array(buf);
    buf = buf.buffer;
  }

  // Extract arraybuffer from TypedArray
  if (buf instanceof Uint8Array) {
    // buf = buf.slice(0, buf.byteLength, buf.buffer.byteOffset).buffer;

    // buf = buf.slice(0, buf.byteLength, buf.buffer.byteOffset).buffer;

    // trying this first.
    buf = buf.slice(0, buf.byteLength).buffer;
    // if it doesn't work, try this:

    // const slicedUint8Array = new Uint8Array(buf.buffer);
    // const arrayBuffer = slicedUint8Array.buffer;
  }

  // error if none of the above worked
  if (!(buf instanceof ArrayBuffer)) {
    throw new TypeError(`could not coerce '${name}' to ArrayBuffer`);
  }

  return buf;
}

function coerceToBase64Url(thing, name) {
  if (!name) {
    throw new TypeError("name not specified in coerceToBase64");
  }

  if (typeof thing === "string") {
    // Convert from base64 to base64url
    thing = thing
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/={0,2}$/g, "");
  }

  if (typeof thing !== "string") {
    try {
      thing = base64.fromArrayBuffer(coerceToArrayBuffer(thing, name), true);
    } catch (_err) {
      throw new Error(`could not coerce '${name}' to string`);
    }
  }

  return thing;
}
