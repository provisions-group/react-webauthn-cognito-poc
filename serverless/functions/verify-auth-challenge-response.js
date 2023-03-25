module.exports.handler = async (event) => {
  //TODO: get device from db.  the body of the request will have the device id.
  // TODO: use the webauthn verifyAuthenticationResponse() method to verify the challengeAnswer
  const expectedAnswer =
    event?.request?.privateChallengeParameters?.secretLoginCode;
  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  //TODO: if answer is correct, update device counter for user and save in db

  return event;
};
