const { verifyRegistrationResponse } = require("@simplewebauthn/server");
const { isoUint8Array } = require("@simplewebauthn/server/helpers");
const {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

module.exports.handler = async (event) => {
  // TODO: use the webauthn verifyAuthenticationResponse() method to verify the challengeAnswer

  // RegistrationResponseJSON
  const body = JSON.parse(event.request.challengeAnswer);

  // VerifiedRegistrationResponse;
  let verification;

  const expectedAnswer =
    event?.request?.privateChallengeParameters?.secretLoginCode;

  const port = 5173;

  // VerifyRegistrationResponseOpts
  const opts = {
    response: body,
    expectedChallenge: `${expectedAnswer}`,
    expectedOrigin: `http://localhost:${port}`,
    expectedRPID: "localhost",
    requireUserVerification: true,
  };

  verification = await verifyRegistrationResponse(opts);

  const { verified, registrationInfo } = verification;

  // if (event.request.challengeAnswer === expectedAnswer) {
  if (verified) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  // if answer is correct, update device counter for user and save in db
  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    const devices = parseDevices(
      event.request.userAttributes["custom:devices"]
    );

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

      // user.devices.push(newDevice);
    }
  }
  return event;
};

// returns AuthenticatorDevice[]
function parseDevices(devicesString) {
  if (!devicesString) return [];

  return JSON.parse(devicesString);
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
