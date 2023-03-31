// const _ = require('lodash')

import { Context, Callback } from "aws-lambda";
import { CognitoDefineAuthEvent } from "../local-types";
import * as _ from "lodash";

export const handler = (
  event: CognitoDefineAuthEvent,
  context: Context,
  callback: Callback
) => {
  const lastAttempt = _.last(event.request.session);

  if (
    event.request.session.length &&
    lastAttempt &&
    lastAttempt.challengeName === "CUSTOM_CHALLENGE" &&
    lastAttempt.challengeResult === true
  ) {
    // Authenticator validated
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else if (!event.request.session.length) {
    // Initial auth request, start custom challenge flow
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = "CUSTOM_CHALLENGE";
  } else {
    // Authenticator failed the attestation or assertion challenges
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  }

  callback(null, event);
};
