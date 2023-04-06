import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";

export interface AuthContextType {
  user: any;
  getCurrentSession: () => Promise<void>;
  configureFlow: (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => void;
  signUpWebAuthn: (email: string) => Promise<void>;
  signInWebAuthn: (email: string) => Promise<void>;
  signUp: (form: { email: string; password: string }) => Promise<void>;
  signIn: (form: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);

  const getCurrentSession = async () => {
    configureFlow("USER_SRP_AUTH");

    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
    } catch (error) {
      console.log("error:", error);
      setUser(null);
    }
  };

  const configureFlow = (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => {
    Amplify.configure({
      Auth: { ...AwsConfigAuth, authenticationFlowType: flow },
    });
  };

  const signUp = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    configureFlow("USER_SRP_AUTH");
    try {
      const signInResult = await Auth.signUp({
        username: email,
        password,
      });

      console.log(signInResult);
    } catch (error) {
      console.log("error:", error);
      setUser(null);
    }
  };

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    configureFlow("USER_SRP_AUTH");
    const cognitoUser = await Auth.signIn(email, password);
    setUser(cognitoUser);
  };

  const signUpWebAuthn = async (email: string) => {
    configureFlow("CUSTOM_AUTH");

    try {
      const unauthenticatedUser = await Auth.signIn(email);

      const registrationResponse = await startRegistration(
        JSON.parse(unauthenticatedUser.challengeParam.attestationChallenge)
      );

      const cognitoUser = await Auth.sendCustomChallengeAnswer(
        unauthenticatedUser,
        JSON.stringify(registrationResponse)
      );

      setUser(cognitoUser);
    } catch (error) {
      console.log("error:", error);
      setUser(null);
    }
  };

  const signInWebAuthn = async (email: string) => {
    configureFlow("CUSTOM_AUTH");

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
    } catch (error) {
      console.log("error:", error);
      setUser(null);
    }
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    getCurrentSession,
    configureFlow,
    signUpWebAuthn,
    signInWebAuthn,
    signUp,
    signIn,
    signOut,
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
