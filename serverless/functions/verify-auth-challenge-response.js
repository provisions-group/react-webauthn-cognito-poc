const { verifyRegistrationResponse } = require("@simplewebauthn/server");

module.exports.handler = async (event) => {
  //TODO: get device from db.  the body of the request will have the device id.
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

  //TODO: if answer is correct, update device counter for user and save in db

  return event;
};
