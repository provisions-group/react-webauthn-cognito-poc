import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { fakeAuthProvider } from "../auth";

export interface AuthContextType {
  user: any;
  signinWebAuthn: (user: string, callback: VoidFunction) => void;
  signin: (user: string, callback: VoidFunction) => void;
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
  const signin = (newUser: string, callback: VoidFunction) => {
    return fakeAuthProvider.signin(() => {
      setUser(newUser);
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
