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
import { CognitoCreateAuthEvent } from "../local-types";
import { hasRegisteredDevice, parseDevices } from "../utils";

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
