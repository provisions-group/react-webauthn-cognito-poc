const {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { isoUint8Array } = require("@simplewebauthn/server/helpers");
const {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

module.exports.handler = async (event) => {
  // RegistrationResponseJSON
  const body = JSON.parse(event.request.challengeAnswer);
  const expectedAnswer = event?.request?.privateChallengeParameters?.challenge;
  const port = 5173;

  if (hasRegisteredDevice(event.request.userAttributes)) {
    const devices = parseDevices(
      event.request.userAttributes["custom:devices"]
    );
    // currently only allowing one device
    const device = devices[0];
    // VerifyAuthenticationResponseOpts
    const opts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: `http://localhost:${port}`,
      expectedRPID: "localhost",
      authenticator: device,
      requireUserVerification: true,
    };

    // VerifiedAuthenticationResponse
    const verification = await verifyAuthenticationResponse(opts);

    const { verified, authenticationInfo } = verification;

    // update device
    if (verified) {
      event.response.answerCorrect = true;
      updateUserDevice(event, authenticationInfo);
    } else {
      event.response.answerCorrect = false;
    }
  } else {
    // VerifyRegistrationResponseOpts
    const opts = {
      response: body,
      expectedChallenge: `${expectedAnswer}`,
      expectedOrigin: `http://localhost:${port}`,
      expectedRPID: "localhost",
      requireUserVerification: true,
    };

    // VerifiedRegistrationResponse
    const verification = await verifyRegistrationResponse(opts);

    const { verified, registrationInfo } = verification;

    if (verified) {
      event.response.answerCorrect = true;
      await addDeviceToUser(event, registrationInfo);
    } else {
      event.response.answerCorrect = false;
    }
  }

  return event;
};

async function updateUserDevice(event, authenticationInfo) {
  if (!authenticationInfo) return;
  const { counter } = authenticationInfo;
  const devices = parseDevices(event.request.userAttributes["custom:devices"]);

  const existingDevice = devices.find((device) =>
    isoUint8Array.areEqual(device.credentialID, credentialID)
  );

  const device = { ...existingDevice, counter: counter };

  // currently only saving one device.  overwriting previous values
  await adminUpdateUserAttributes(event.userPoolId, event.userName, [device]);
}

async function addDeviceToUser(event, registrationInfo) {
  if (!registrationInfo) return;
  const body = JSON.parse(event.request.challengeAnswer);
  const { credentialPublicKey, credentialID, counter } = registrationInfo;
  const devices = parseDevices(event.request.userAttributes["custom:devices"]);

  const existingDevice = devices.find((device) =>
    isoUint8Array.areEqual(device.credentialID, credentialID)
  );

  if (!existingDevice) {
    /**
     * Add the returned device to the user's list of devices
     */
    // AuthenticatorDevice
    const newDevice = {
      credentialPublicKey,
      credentialID,
      counter,
      transports: body.response.transports,
    };

    // currently only saving one device.  overwriting previous values
    await adminUpdateUserAttributes(event.userPoolId, event.userName, [
      newDevice,
    ]);
  }
}

async function adminUpdateUserAttributes(userPoolId, username, devices) {
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
    // ClientMetadata: {
    //   // ClientMetadataType
    //   "<keys>": "STRING_VALUE",
    // },
  };
  const command = new AdminUpdateUserAttributesCommand(input);

  const response = await client.send(command);

  return response;
}

function hasRegisteredDevice(userAttributes) {
  const devices = parseDevices(userAttributes["custom:devices"]);
  return devices.length > 0;
}

// returns AuthenticatorDevice[]
function parseDevices(devicesString) {
  if (!devicesString) return [];

  return JSON.parse(devicesString);
}
