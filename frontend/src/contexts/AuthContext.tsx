import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { fakeAuthProvider } from "../auth";
import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";

console.log("AwsConfigAuth:", AwsConfigAuth);

Amplify.configure({ Auth: AwsConfigAuth });

export interface AuthContextType {
  user: any;
  signinWebAuthn: (user: string, callback: VoidFunction) => void;
  signin: (
    form: { email: string; password: string },
    callback: VoidFunction
  ) => Promise<void>;
  signout: (callback: VoidFunction) => void;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);

  const signinWebAuthn = (newUser: string, callback: VoidFunction) => {
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

  const signin = async (
    { email, password }: { email: string; password: string },
    callback: VoidFunction
  ) => {
    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);
    // Auth.signIn();
    return fakeAuthProvider.signin(() => {
      setUser(email);
      callback();
    });
  };

  const signout = (callback: VoidFunction) => {
    return fakeAuthProvider.signout(() => {
      setUser(null);
      callback();
    });
  };

  const value = { user, signinWebAuthn, signin, signout };

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
