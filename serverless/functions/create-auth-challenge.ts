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

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials: devices.map((dev) => ({
      id: dev.credentialID,
      type: "public-key",
      transports: dev.transports,
    })),
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
    excludeCredentials: devices.map((dev) => ({
      id: dev.credentialID,
      type: "public-key",
      transports: dev.transports,
    })),
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

function parseDevices(event: CognitoCreateAuthEvent): Authenticator[] {
  const devicesString = event.request.userAttributes["custom:devices"];
  if (!devicesString) return [];

  const devices: Authenticator[] = JSON.parse(devicesString);

  return devices.map((device) => ({
    credentialID: Buffer.from(device.credentialID), // JSON.parse does not recursively resolve ArrayBuffers
    credentialPublicKey: Buffer.from(device.credentialPublicKey), // JSON.parse does not recursively resolve ArrayBuffers
    counter: device.counter,
    transports: device.transports || [],
  }));
}
