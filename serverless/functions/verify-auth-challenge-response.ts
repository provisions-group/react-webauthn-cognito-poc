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
import { coerceToBase64Url, hasRegisteredDevice, parseDevices } from "../utils";

export const handler = async (
  event: CognitoVerifyAuthEvent,
  context: Context,
  callback: Callback
) => {
  // RegistrationResponseJSON
  const body = JSON.parse(event.request.challengeAnswer);

  if (hasRegisteredDevice(event)) {
    const devices = parseDevices(event);
    // currently only allowing one device
    const device = devices[0];

    const expectedAnswer =
      event?.request?.privateChallengeParameters?.assertionChallenge;
    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: process.env.RELYING_PARTY_ORIGIN || "",
      expectedRPID: process.env.RELYING_PARTY_ID || "",
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
    const expectedAnswer =
      event?.request?.privateChallengeParameters?.attestationChallenge;

    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: process.env.RELYING_PARTY_ORIGIN || "",
      expectedRPID: process.env.RELYING_PARTY_ID || "",
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
    const newDevice: Authenticator = {
      credentialID: coerceToBase64Url(credentialID, "credentialID"),
      credentialPublicKey: coerceToBase64Url(
        credentialPublicKey,
        "credentialPublicKey"
      ),
      counter: counter || 0,
      transports: body.response.transports,
    };

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
