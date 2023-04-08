# react-webauthn-cognito-poc

This project is an example of how to set up biometric login for web-based apps ([WebAuthn](https://webauthn.io/)) using [Amazon Cognito](https://aws.amazon.com/cognito/) as the identity provider. This project accomplishes this by leaning on [AWS Cognito custom authentication challenges](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html) and the [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) library.

For more information on how this works, here are some references:
- [https://aws.amazon.com/blogs/security/how-to-implement-password-less-authentication-with-amazon-cognito-and-webauthn/](https://aws.amazon.com/blogs/security/how-to-implement-password-less-authentication-with-amazon-cognito-and-webauthn/)
- [Getting Started with WebAuthn with Nick Steele](https://youtu.be/yccBhpdJjJc)

This project takes inspiration from the following projects:

- [https://github.com/MasterKale/SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn)
- [https://github.com/aws-samples/webauthn-with-amazon-cognito](https://github.com/aws-samples/webauthn-with-amazon-cognito)
- [https://github.com/lockdrop/cdk-serverless-cognito-fido2-webauthn](https://github.com/lockdrop/cdk-serverless-cognito-fido2-webauthn)
- [https://github.com/webauthn-open-source/fido2-lib](https://github.com/webauthn-open-source/fido2-lib)

The project uses the following libraries for handling the biometric login flow:

- [https://github.com/MasterKale/SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn)
- [https://github.com/feross/buffer](https://github.com/feross/buffer)
- [https://github.com/Hexagon/base64](https://github.com/Hexagon/base64)

## Running the project

To run the project, make sure that you have an AWS account and have configured the serverless cli

Create an AWS account if you don't already have one, and set up credentials to be used with Serverless
[https://www.serverless.com/framework/docs/providers/aws/guide/credentials/](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

Install the serverless cli:
`npm install -g serverless`

## Deploying the backend to AWS

### 1. Install and Initial Deploy

Create a `.env` file in the `/serverless` directory and paste in this content:

```
RELYING_PARTY_ORIGIN=http://localhost:5173
RELYING_PARTY_ID=localhost
```

> These values should be set to the URL of the relying party site, since we're running the relying party locally (frontend project), these values above should be fine.

From the `/serverless` directory, run the following commands:

`npm install`

`sls deploy`

### 2. Enable IAM role for VerifyAuthChallengeResponse Lambda Function

In the `serverless.yml` file, uncomment the section under the `verifyAuthChallengeResponse` function. Looks like this:

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

### 3. Configure the frontend

Create a `.env.local` file in the `/frontend` directory and paste in this content:

```
VITE_AUTH_REGION=us-east-2
VITE_AUTH_USER_POOL_ID=us-east-2_user-pool-id
VITE_AUTH_USER_POOL_WEB_CLIENT_ID=user-pool-web-client-id
VITE_AUTH_COOKIE_STORAGE_DOMAIN=localhost
```

> Replace the values with your own. I've left in some fake ones as an example.

Add the `AWS Region`,`User Pool ID`, and `User Pool Web Client ID` to the created .env file in the `/frontend` directory

### 4. Run the frontend

From the `/frontend` directory, run the following commands:

`npm install`

`npm run dev`

## You did it! No more passwords!

## Cleanup

### 1. Removing backend

run `sls remove`

> If it fails to remove the stack, you might need to manually delete the S3 deployment bucket

### 2. Delete created passkeys from browser

Passkeys located here in Chrome:
`chrome://settings/passkeys`
