# react-webauthn-cognito-poc

## Installing dependencies

- run `npm install` from the `/frontend` directory
- create .env file with the following parameters. Replace the values with your own. I've left in some fake ones as an example:

```
VITE_AUTH_REGION=us-east-2
VITE_AUTH_USER_POOL_ID=us-east-2_user-pool-id
VITE_AUTH_USER_POOL_WEB_CLIENT_ID=user-pool-web-client-id
VITE_AUTH_COOKIE_STORAGE_DOMAIN=localhost
```

## Running the frontend

- run `npx npm run dev` from the `/frontend` directory

## Deploying the backend to AWS

Create an AWS account if you don't already have one, and set up credentials to be used with Serverless
[https://www.serverless.com/framework/docs/providers/aws/guide/credentials/](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)

Install the serverless cli
`npm install -g serverless`

- run `npm ci` from the `/serverless` directory
- run `npx sls deploy` from the `/serverless` directory
