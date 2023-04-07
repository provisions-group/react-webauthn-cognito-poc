import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";

export type UserType =
  | "NO_USER"
  | "USER_PASSWORD_ONLY"
  | "USER_WITH_BIOMETRIC_DEVICE";

export interface AuthContextType {
  user: any;
  error: string;
  getCurrentSession: () => Promise<void>;
  checkForUser: (email: string) => Promise<UserType>;
  configureFlow: (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => void;
  signUpWebAuthn: (email: string) => Promise<void>;
  signInWebAuthn: (email: string) => Promise<void>;
  signUp: (form: { email: string; password: string }) => Promise<void>;
  signIn: (form: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  disableWebAuthn: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);
  const [error, setError] = React.useState<any>(null);

  const initFlow = (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => {
    setError("");
    Amplify.configure({
      Auth: { ...AwsConfigAuth, authenticationFlowType: flow },
    });
  };

  const getCurrentSession = async () => {
    initFlow("USER_SRP_AUTH");

    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    }
  };

  const checkForUser = async (email: string): Promise<UserType> => {
    initFlow("USER_SRP_AUTH");

    try {
      const unauthenticatedUser = await Auth.signIn(email);
      // assertionChallenge will exist if the user has registered a biometric device
      return !!unauthenticatedUser.challengeParam.assertionChallenge
        ? "USER_WITH_BIOMETRIC_DEVICE"
        : "USER_PASSWORD_ONLY";
    } catch (error) {
      // ideally check for this
      // error.code === "UserNotFoundException"

      return "NO_USER";
    }
  };

  const signUp = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    initFlow("USER_SRP_AUTH");
    try {
      const signInResult = await Auth.signUp({
        username: email,
        password,
      });

      console.log(signInResult);
    } catch (error: any) {
      setUser(null);
      setError(error.message);
      throw error.message;
    }
  };

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    initFlow("USER_SRP_AUTH");
    try {
      const cognitoUser = await Auth.signIn(email, password);
      setUser(cognitoUser);
    } catch (error: any) {
      setUser(null);
      setError(error.message);
      throw error.message;
    }
  };

  const signUpWebAuthn = async (email: string) => {
    initFlow("CUSTOM_AUTH");

    try {
      const unauthenticatedUser = await Auth.signIn(email);

      const registrationResponse = await startRegistration(
        JSON.parse(unauthenticatedUser.challengeParam.attestationChallenge)
      );

      const cognitoUser = await Auth.sendCustomChallengeAnswer(
        unauthenticatedUser,
        JSON.stringify(registrationResponse)
      );

      // setUser(cognitoUser);
    } catch (error: any) {
      setUser(null);
      setError(error.message);
      throw error.message;
    }
  };

  const signInWebAuthn = async (email: string) => {
    initFlow("CUSTOM_AUTH");

    try {
      const unauthenticatedUser = await Auth.signIn(email);

      const authenticationResponse = await startAuthentication(
        JSON.parse(unauthenticatedUser.challengeParam.assertionChallenge)
      );

      const cognitoUser = await Auth.sendCustomChallengeAnswer(
        unauthenticatedUser,
        JSON.stringify(authenticationResponse)
      );

      setUser(cognitoUser);
    } catch (error: any) {
      setUser(null);
      setError(error.message);
      throw error.message;
    }
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
  };

  // for the love of passwords
  const disableWebAuthn = async () => {
    await Auth.deleteUserAttributes(user, ["custom:devices"]);
  };

  const value = {
    user,
    error,
    checkForUser,
    getCurrentSession,
    configureFlow: initFlow,
    signUpWebAuthn,
    signInWebAuthn,
    signUp,
    signIn,
    signOut,
    disableWebAuthn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}

export const Authenticated = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Consumer>
      {(auth) => {
        if (auth.user) return children;
        return null;
      }}
    </AuthContext.Consumer>
  );
};

export const Unauthenticated = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthContext.Consumer>
      {(auth) => {
        if (auth.user === null) return children;
        return null;
      }}
    </AuthContext.Consumer>
  );
};
