import { Callback, Context } from "aws-lambda";

export const handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  event.response.autoConfirmUser = true;

  callback(null, event);
};
