import React from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { fakeAuthProvider } from "../auth";
import { Amplify, Auth } from "aws-amplify";
import { AwsConfigAuth } from "../auth.config";
import base64 from "@hexagon/base64";

export interface AuthContextType {
  user: any;
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

    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);

    // TODO: temp
    const options = parseWebAuthnOptions(cognitoUser);
    console.log("registration options:", options);

    const registrationResponse = await startRegistration(
      parseWebAuthnOptions(cognitoUser)
    );

    console.log("registrationResponse:", registrationResponse);

    const challengeResult = await Auth.sendCustomChallengeAnswer(
      cognitoUser,
      JSON.stringify(registrationResponse)
    );

    console.log(challengeResult);

    setUser(email);
  };

  const signInWebAuthn = async (email: string) => {
    configureFlow("CUSTOM_AUTH");

    const cognitoUser = await Auth.signIn(email);
    console.log(cognitoUser);

    console.log(
      "parseWebAuthnOptions(cognitoUser):",
      parseWebAuthnOptions(cognitoUser)
    );

    const authenticationResponse = await startAuthentication(
      parseWebAuthnOptions(cognitoUser)
    );

    console.log("authenticationResponse:", authenticationResponse);

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

  // return JSON.parse(optionsString);
  const options = JSON.parse(optionsString);

  // for (let i = 0; i < options.allowCredentials.length; i++) {
  //   options.allowCredentials[i].id = coerceToArrayBuffer(
  //     options.allowCredentials[i].id,
  //     "id"
  //   );
  // }

  return options;
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

function coerceToArrayBuffer(buf: any, name: string) {
  if (!name) {
    throw new TypeError("name not specified in coerceToArrayBuffer");
  }

  // Handle empty strings
  if (typeof buf === "string" && buf === "") {
    buf = new Uint8Array(0);

    // Handle base64url and base64 strings
  } else if (typeof buf === "string") {
    // base64 to base64url
    buf = buf.replace(/\+/g, "-").replace(/\//g, "_").replace("=", "");
    // base64 to Buffer
    buf = base64.toArrayBuffer(buf, true);
  }

  // Extract typed array from Array
  if (Array.isArray(buf)) {
    buf = new Uint8Array(buf);
  }

  // Extract ArrayBuffer from Node buffer
  if (typeof Buffer !== "undefined" && buf instanceof Buffer) {
    buf = new Uint8Array(buf);
    buf = buf.buffer;
  }

  // Extract arraybuffer from TypedArray
  if (buf instanceof Uint8Array) {
    // buf = buf.slice(0, buf.byteLength, buf.buffer.byteOffset).buffer;

    // buf = buf.slice(0, buf.byteLength, buf.buffer.byteOffset).buffer;

    // trying this first.
    buf = buf.slice(0, buf.byteLength).buffer;
    // if it doesn't work, try this:

    // const slicedUint8Array = new Uint8Array(buf.buffer);
    // const arrayBuffer = slicedUint8Array.buffer;
  }

  // error if none of the above worked
  if (!(buf instanceof ArrayBuffer)) {
    throw new TypeError(`could not coerce '${name}' to ArrayBuffer`);
  }

  return buf;
}
