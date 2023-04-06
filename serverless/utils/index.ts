import base64 from "@hexagon/base64";
import {
  Authenticator,
  CognitoCreateAuthEvent,
  CognitoVerifyAuthEvent,
} from "../local-types";

export function hasRegisteredDevice(
  event: CognitoVerifyAuthEvent | CognitoCreateAuthEvent
) {
  const devices = parseDevices(event);
  return devices.length > 0;
}

export function parseDevices(
  event: CognitoVerifyAuthEvent | CognitoCreateAuthEvent
): Authenticator[] {
  const devicesString = event.request.userAttributes["custom:devices"];
  if (!devicesString) return [];

  const devices: Authenticator[] = JSON.parse(devicesString);

  return devices.map((device) => ({
    credentialID: coerceToUint8Array(device.credentialID, "id"),
    credentialPublicKey: coerceToUint8Array(device.credentialPublicKey, "key"),
    counter: device.counter,
    transports: device.transports || [],
  }));
}

export function coerceToUint8Array(buf, name) {
  const arrayBuf = coerceToArrayBuffer(buf, name);
  return new Uint8Array(arrayBuf);
}

export function coerceToArrayBuffer(buf, name) {
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
    buf = buf.slice(0, buf.byteLength).buffer;
  }

  // error if none of the above worked
  if (!(buf instanceof ArrayBuffer)) {
    throw new TypeError(`could not coerce '${name}' to ArrayBuffer`);
  }

  return buf;
}

export function coerceToBase64Url(thing, name) {
  if (!name) {
    throw new TypeError("name not specified in coerceToBase64");
  }

  if (typeof thing === "string") {
    // Convert from base64 to base64url
    thing = thing
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/={0,2}$/g, "");
  }

  if (typeof thing !== "string") {
    try {
      thing = base64.fromArrayBuffer(coerceToArrayBuffer(thing, name), true);
    } catch (_err) {
      throw new Error(`could not coerce '${name}' to string`);
    }
  }

  return thing;
}
