import { AuthenticatorTransport } from "@simplewebauthn/typescript-types";

// These types really should exist in the CDK aws-lambda module (similar to API GW types), but unfortunately they dont.
// These are based off of the documentation here: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html

// Create

export interface CognitoCreateAuthEventRequestSession {
  challengeName: string;
  challengeResult: boolean;
  challengeMetadata: string;
}

export interface CognitoCreateAuthEventRequest {
  userAttributes: {
    [key: string]: string;
  };
  challengeName: string;
  session: CognitoCreateAuthEventRequestSession[];
  userNotFound: boolean;
  clientMetadata: {
    [key: string]: string;
  };
}

export interface CognitoCreateAuthEventResponse {
  publicChallengeParameters: {
    [key: string]: string;
  };
  privateChallengeParameters: {
    [key: string]: string;
  };
  challengeMetadata: string;
}

export interface CognitoCreateAuthEvent {
  request: CognitoCreateAuthEventRequest;
  response: CognitoCreateAuthEventResponse;
}

// Define

export interface CognitoDefineAuthEventRequestSession {
  challengeName: string;
  challengeResult: boolean;
  challengeMetadata: string;
}

export interface CognitoDefineAuthEventRequest {
  userAttributes: {
    [key: string]: string;
  };
  session: CognitoDefineAuthEventRequestSession[];
  userNotFound: boolean;
  clientMetadata: {
    [key: string]: string;
  };
}

export interface CognitoDefineAuthEventResponse {
  challengeName: string;
  issueTokens: boolean;
  failAuthentication: boolean;
}

export interface CognitoDefineAuthEvent {
  request: CognitoDefineAuthEventRequest;
  response: CognitoDefineAuthEventResponse;
}

// Verify

export interface CognitoVerifyAuthEventRequest {
  userAttributes: {
    [key: string]: string;
  };
  privateChallengeParameters: {
    [key: string]: string;
  };
  challengeAnswer: string;
  userNotFound: boolean;
  clientMetadata: {
    [key: string]: string;
  };
}

export interface CognitoVerifyAuthEventResponse {
  answerCorrect: boolean;
}

export interface CognitoVerifyAuthEvent {
  request: CognitoVerifyAuthEventRequest;
  response: CognitoVerifyAuthEventResponse;
  userPoolId: string;
  userName: string;
}

// https://simplewebauthn.dev/docs/packages/server#installing
export type Authenticator = {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  // ['usb' | 'ble' | 'nfc' | 'internal']
  transports?: AuthenticatorTransport[];
};
