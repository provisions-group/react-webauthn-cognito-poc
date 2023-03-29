const _ = require("lodash");
const { generateRegistrationOptions } = require("@simplewebauthn/server");
const Chance = require("chance");
const chance = new Chance();
const { MAX_ATTEMPTS } = require("../lib/constants");

const { SES_FROM_ADDRESS } = process.env;

module.exports.handler = async (event) => {
  if (!event.request.userAttributes.email) {
    throw new Error("missing email");
  }

  let options;
  if (!event.request.session || !event.request.session.length) {
    // new auth session

    // if user does not have registered device, then do this:
    // TODO: for registration use webauthn generateRegistrationOptions(). this possibly needs to be another lambda function using the sign-up post confirmation trigger

    // const user = await adminGetUser(event.userPoolId, event.userName);
    options = await generateDeviceRegistrationOptions(
      event.userName,
      event.request.userAttributes
    );

    // if user has registered device, then do this:
    // TODO: for authentication use webauthn generateAuthenticationOptions() to create the challenge. remove sendEmail and otpCode. most likely will remove existing session portion.
  } else {
    //TODO: i think if the existing session exists, then do webauthn verifyRegistrationResponse(). then save the device from the result to the db. this possibly needs to be another lambda function using the sign-up post confirmation trigger.

    // existing session, user has provided a wrong answer, so we need to
    // give them another chance
    const previousChallenge = _.last(event.request.session);
    const challengeMetadata = previousChallenge?.challengeMetadata;

    if (challengeMetadata) {
      // do stuff ?
    }
  }

  const attempts = _.size(event.request.session);
  const attemptsLeft = MAX_ATTEMPTS - attempts;

  event.response.publicChallengeParameters = {
    options: JSON.stringify(options),
    email: event.request.userAttributes.email,
    maxAttempts: MAX_ATTEMPTS,
    attempts,
    attemptsLeft,
  };

  // NOTE: the private challenge parameters are passed along to the
  // verify step and is not exposed to the caller
  // need to pass the challenge along so we can verify the user's answer
  event.response.privateChallengeParameters = {
    challenge: options.challenge,
  };

  // TODO: remove this if possible
  event.response.challengeMetadata = `CODE-${options.challenge}`;

  return event;
};

async function generateDeviceRegistrationOptions(username, userAttributes) {
  const devices = parseDevices(userAttributes["custom:devices"]);

  const opts = {
    rpName: "SimpleWebAuthn Example",
    rpID: "localhost",
    userID: username,
    userName: username,
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

// returns AuthenticatorDevice[]
function parseDevices(devicesString) {
  if (!devicesString) return [];

  return JSON.parse(devicesString);
}
