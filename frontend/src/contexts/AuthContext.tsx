import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { fakeAuthProvider } from "../auth";
import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";

Amplify.configure({ Auth: AwsConfigAuth });

export interface AuthContextType {
  user: any;
  signInWebAuthn: (user: string, callback: VoidFunction) => void;
  signIn: (
    form: { email: string; password: string },
    callback: VoidFunction
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);

  const signInWebAuthn = (newUser: string, callback: VoidFunction) => {
    // TODO: add webauthn. guide: https://simplewebauthn.dev/docs/packages/browser

    // if first time
    // startRegistration();
    // startAuthentication();

    // if return user
    // startAuthentication();

    return fakeAuthProvider.signin(() => {
      setUser(newUser);
      callback();
    });
  };

  const signIn = async (
    { email, password }: { email: string; password: string },
    callback: VoidFunction
  ) => {
    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);

    // TODO: if user exists w/ auth devices use startAuthentication();

    const registrationResponse = await startRegistration(
      parseRegistrationOptions(cognitoUser)
    );

    const challengeResult = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(registrationResponse)
    );

    console.log(challengeResult);
    // Auth.signIn();
    return fakeAuthProvider.signin(() => {
      setUser(email);
      callback();
    });
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
  };

  const value = { user, signInWebAuthn, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const parseRegistrationOptions = (cognitoUser: any) => {
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
