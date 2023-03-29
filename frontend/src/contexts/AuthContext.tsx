import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { fakeAuthProvider } from "../auth";
import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";

export interface AuthContextType {
  user: any;
  configureFlow: (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => void;
  signInWebAuthn: (email: string) => Promise<void>;
  signUp: (form: { email: string; password: string }) => Promise<void>;
  signIn: (form: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);
  const [currentFlow, setCurrentFlow] = React.useState<
    "USER_SRP_AUTH" | "CUSTOM_AUTH"
  >("USER_SRP_AUTH");

  const configureFlow = (flow: "USER_SRP_AUTH" | "CUSTOM_AUTH") => {
    setCurrentFlow(flow);

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
    const signInResult = await Auth.signUp({
      username: email,
      password,
    });
    console.log(signInResult);
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
    console.log(cognitoUser);

    setUser(email);
  };

  const signUpWebAuthn = async (email: string) => {
    configureFlow("CUSTOM_AUTH");

    console.log("email:", email);
    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);

    const registrationResponse = await startRegistration(
      parseWebAuthnOptions(cognitoUser)
    );

    const challengeResult = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(registrationResponse)
    );

    console.log(challengeResult);

    setUser(email);
  };

  const signInWebAuthn = async (email: string) => {
    configureFlow("CUSTOM_AUTH");

    console.log("email:", email);
    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);

    const authenticationResponse = await startAuthentication(
      parseWebAuthnOptions(cognitoUser)
    );

    const challengeResult = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(authenticationResponse)
    );

    console.log(challengeResult);

    setUser(email);
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    currentFlow,
    configureFlow,
    signUpWebAuthn,
    signInWebAuthn,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const parseWebAuthnOptions = (cognitoUser: any) => {
  if (!cognitoUser) return null;

  const optionsString = cognitoUser.challengeParam.options;

  return JSON.parse(optionsString);
};

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
