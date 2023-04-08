# react-webauthn-cognito-poc

## Deploying the backend to AWS

Create an AWS account if you don't already have one, and set up credentials to be used with Serverless
[https://www.serverless.com/framework/docs/providers/aws/guide/credentials/](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

Install the serverless cli
`npm install -g serverless`

Run `npm install` from the `/serverless` directory

Run `sls deploy` from the `/serverless` directory

Enable IAM role for VerifyAuthChallengeResponse Lambda Function:

Uncomment the section under the `verifyAuthChallengeResponse` function. Looks like this:

```

verifyAuthChallengeResponse:
handler: ./functions/verify-auth-challenge-response.handler
# Leave the following section commented out on the first deployment.
# Enable this section once you can add the created user pool resource arn
# iamRoleStatementsName: verifyAuthChallengeRes-cognito-idp_AdminUpdateUserAttributes
# iamRoleStatements:
# - Effect: Allow # Action: cognito-idp:AdminUpdateUserAttributes
# # Paste User Pool Resource ARN here
# Resource: your-resource-arn

```

Find the Cognito User Pool on AWS and copy the user pool's ARN. Paste it in the serverless.yml file for the correct iamRoleStatement.

> locate: 'Paste User Pool Resource ARN here'

Create a `.env` file in the `/frontend` directory and paste in this content:

```

VITE_AUTH_REGION=us-east-2
VITE_AUTH_USER_POOL_ID=us-east-2_user-pool-id
VITE_AUTH_USER_POOL_WEB_CLIENT_ID=user-pool-web-client-id
VITE_AUTH_COOKIE_STORAGE_DOMAIN=localhost

```

- Replace the values with your own. I've left in some fake ones as an example:

Add the `AWS Region`,`User Pool ID`, and `User Pool Web Client ID` to the created .env file in the `/frontend` directory

## Run the frontend

- run `npm install` from the `/frontend` directory
- run `npm run dev` from the `/frontend` directory

## Removing backend

run `sls remove`

> If it fails to remove the stack, you might need to manually delete the S3 deployment bucket

## Passkeys located here in Chrome:

chrome://settings/passkeys
