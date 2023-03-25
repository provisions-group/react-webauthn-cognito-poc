module.exports.handler = async (event) => {
  // TODO: possibly remove this lambda function
  event.response.autoConfirmUser = true;
  return event;
};
