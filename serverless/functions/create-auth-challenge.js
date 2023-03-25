const _ = require("lodash");
const Chance = require("chance");
const chance = new Chance();
const SES = require("aws-sdk/clients/sesv2");
const ses = new SES();
const { MAX_ATTEMPTS } = require("../lib/constants");

const { SES_FROM_ADDRESS } = process.env;

module.exports.handler = async (event) => {
  if (!event.request.userAttributes.email) {
    throw new Error("missing email");
  }

  let otpCode;
  if (!event.request.session || !event.request.session.length) {
    // new auth session

    // TODO: for registration use webauthn generateRegistrationOptions(). this possibly needs to be another lambda function using the sign-up post confirmation trigger

    // TODO: for authentication use webauthn generateAuthenticationOptions() to create the challenge. remove sendEmail and otpCode. most likely will remove existing session portion.

    otpCode = chance.string({ length: 6, alpha: false, symbols: false });
    await sendEmail(event.request.userAttributes.email, otpCode);
  } else {
    //TODO: i think if the existing session exists, then do webauthn verifyRegistrationResponse(). then save the device from the result to the db. this possibly needs to be another lambda function using the sign-up post confirmation trigger.

    //TODO: figure out how to set event.request.userAttributes for setting devices in the customAttributes

    // existing session, user has provided a wrong answer, so we need to
    // give them another chance
    const previousChallenge = _.last(event.request.session);
    const challengeMetadata = previousChallenge?.challengeMetadata;

    if (challengeMetadata) {
      // challengeMetadata should start with "CODE-", hence index of 5
      otpCode = challengeMetadata.substring(5);
    }
  }

  const attempts = _.size(event.request.session);
  const attemptsLeft = MAX_ATTEMPTS - attempts;
  event.response.publicChallengeParameters = {
    email: event.request.userAttributes.email,
    maxAttempts: MAX_ATTEMPTS,
    attempts,
    attemptsLeft,
  };

  // TODO: instead of otpCode, use the result from webauthn generateAuthenticationOptions()
  // const { challenge } = generateAuthenticationOptions();

  // NOTE: the private challenge parameters are passed along to the
  // verify step and is not exposed to the caller
  // need to pass the secret code along so we can verify the user's answer
  event.response.privateChallengeParameters = {
    secretLoginCode: otpCode,
  };

  // TODO: remove this if possible
  event.response.challengeMetadata = `CODE-${otpCode}`;

  return event;
};

async function sendEmail(emailAddress, otpCode) {
  await ses
    .sendEmail({
      Destination: {
        ToAddresses: [emailAddress],
      },
      FromEmailAddress: SES_FROM_ADDRESS,
      Content: {
        Simple: {
          Subject: {
            Charset: "UTF-8",
            Data: "Your one-time login code",
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `<html><body><p>This is your one-time login code:</p>
                  <h3>${otpCode}</h3></body></html>`,
            },
            Text: {
              Charset: "UTF-8",
              Data: `Your one-time login code: ${otpCode}`,
            },
          },
        },
      },
    })
    .promise();
}
