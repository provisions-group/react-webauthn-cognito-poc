import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";
import {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/typescript-types";

import { Context, Callback } from "aws-lambda";
import { CognitoCreateAuthEvent, Authenticator } from "../local-types";
import { Buffer } from "buffer";
import * as util from "util";
import base64 from "@hexagon/base64";

export const handler = async (
  event: CognitoCreateAuthEvent,
  context: Context,
  callback: Callback
) => {
  event.response.publicChallengeParameters = {};
  event.response.privateChallengeParameters = {};

  let options:
    | PublicKeyCredentialCreationOptionsJSON
    | PublicKeyCredentialRequestOptionsJSON;

  if (!event.request.session || !event.request.session.length) {
    // new auth session

    if (hasRegisteredDevice(event)) {
      options = await generateDeviceAuthenticationOptions(event);
    } else {
      options = await generateDeviceRegistrationOptions(event);
    }

    event.response.publicChallengeParameters = {
      options: JSON.stringify(options),
      //TODO: testing
      devices: hasRegisteredDevice(event)
        ? JSON.stringify(parseDevices(event))
        : "none", // testing
      hasRegisteredDevice: `${hasRegisteredDevice(event)}`,
      email: event.request.userAttributes.email,
    };

    event.response.privateChallengeParameters = {
      challenge: options.challenge,
    };
  }

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
};

async function generateDeviceAuthenticationOptions(
  event: CognitoCreateAuthEvent
) {
  const devices = parseDevices(event);

  // Uncaught (in promise) UserLambdaValidationException: CreateAuthChallenge failed with error The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received an instance of Object.

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    // allowCredentials: devices.map((dev) => ({
    //   id: dev.credentialID,
    //   type: "public-key",
    //   transports: dev.transports,
    // })),
    allowCredentials: devices,
    userVerification: "required",
    rpID: "localhost",
  };

  return generateAuthenticationOptions(opts);
}

async function generateDeviceRegistrationOptions(
  event: CognitoCreateAuthEvent
) {
  const devices = parseDevices(event);

  const opts: GenerateRegistrationOptionsOpts = {
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
    // excludeCredentials: devices.map((dev) => ({
    //   id: dev.credentialID,
    //   type: "public-key",
    //   transports: dev.transports,
    // })),
    excludeCredentials: devices,
    authenticatorSelection: {
      residentKey: "discouraged",
    },
    /**
     * Support the two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  return generateRegistrationOptions(opts);
}

function hasRegisteredDevice(event: CognitoCreateAuthEvent) {
  const devices = parseDevices(event);
  return devices.length > 0;
}

// function parseDevices(event: CognitoCreateAuthEvent): Authenticator[] {
//   const devicesString = event.request.userAttributes["custom:devices"];
//   if (!devicesString) return [];

//   const devices: Authenticator[] = JSON.parse(devicesString);

//   return devices.map((device) => {
//     const encoder = new util.TextEncoder();

//     let credentialIDuint8Array = new Uint8Array(32);
//     let credentialID = device.credentialID;

//     encoder.encodeInto(JSON.stringify(credentialID), credentialIDuint8Array);

//     let credentialPublicKeyuint8Array = new Uint8Array(32);
//     let credentialPublicKey = device.credentialPublicKey;

//     encoder.encodeInto(
//       JSON.stringify(credentialPublicKey),
//       credentialPublicKeyuint8Array
//     );

//     return {
//       // credentialID: Buffer.from(device.credentialID), // JSON.parse does not recursively resolve ArrayBuffers
//       // credentialID: Buffer.from(new Uint8Array(device.credentialID)),
//       id: credentialID,
//       credentialID: credentialID,
//       // credentialPublicKey: Buffer.from(device.credentialPublicKey), // JSON.parse does not recursively resolve ArrayBuffers
//       // credentialPublicKey: Buffer.from(
//       //   new Uint8Array(device.credentialPublicKey)
//       // ),
//       type: "public-key",
//       credentialPublicKey: credentialPublicKey,
//       counter: device.counter,
//       transports: device.transports || [],
//     };
//   });
// }

function parseDevices(event: CognitoCreateAuthEvent): Authenticator[] {
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

//TODO: you are here

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
