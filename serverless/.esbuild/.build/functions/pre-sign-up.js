// functions/pre-sign-up.js
module.exports.handler = async (event) => {
  event.response.autoConfirmUser = true;
  return event;
};
