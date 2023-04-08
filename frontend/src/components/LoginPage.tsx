import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import Toggle from "./Toggle";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import Spinner from "./Spinner";
import EmailInput from "./EmailInput";
import PasswordInput from "./PasswordInput";
import UseBiometricInput from "./UseBiometricInput";
import MainButton from "./MainButton";

export default function LoginPage() {
  const [webAuthnSupported, setWebAuthnSupported] = useState(
    browserSupportsWebAuthn()
  );

  const {
    error,
    signUpWebAuthn,
    signInWebAuthn,
    signIn,
    signUp,
    getCurrentSession,
    checkForUser,
  } = useAuth();

  useEffect(() => {
    getCurrentSession();
  }, []);

  enum Step {
    "FIND_USER",
    "REGISTER_USER",
    "REGISTER_BIOMETRIC_DEVICE",
    "REGISTER_USER_DEVICE",
    "SIGNIN_PASSWORD",
    "SIGNIN_BIOMETRIC",
  }
  const [step, setStep] = useState(Step.FIND_USER);
  const [title, setTitle] = useState("Sign in to your account");

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      useBiometric: false,
    },
    delayError: 200,
  });

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = methods;

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!!error) {
      setErrorMessage(error);
    }
  }, [error]);

  const email = watch("email");

  useEffect(() => {
    if (step === Step.SIGNIN_BIOMETRIC) {
      setErrorMessage("");
      signInWebAuthn(email);
    }

    if (step === Step.REGISTER_BIOMETRIC_DEVICE) {
      _signUpWebAuthn();
    }
  }, [step]);

  const _signUpWebAuthn = async () => {
    setErrorMessage("");
    try {
      await signUpWebAuthn(email);
      setStep(Step.FIND_USER); // to trigger the user to click "next" again.
      setTitle("Login with biometrics");
    } catch (error) {
      console.log("error:", error);
    }
  };

  const onSignIn = async (form: any) => {
    setErrorMessage("");
    if (webAuthnSupported && form.useBiometric) {
      setTitle("Register biometric device");
      setStep(Step.REGISTER_BIOMETRIC_DEVICE);
      setValue("password", "");
    } else {
      await signIn(form);
    }
  };

  const onSignUp = async (form: any) => {
    setErrorMessage("");
    try {
      await signUp(form);
      if (webAuthnSupported && form.useBiometric) {
        setTitle("Register biometric device");
        setStep(Step.REGISTER_BIOMETRIC_DEVICE);
        setValue("password", "");
      } else {
        setTitle("Sign in with password");
        setStep(Step.SIGNIN_PASSWORD);
        setValue("password", "");
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const onStartOver = () => {
    setStep(Step.FIND_USER); // to trigger the user to click "next" again.
    setErrorMessage("");
    setTitle("Sign in to your account");
    setValue("email", "");
    setValue("password", "");
    setValue("useBiometric", false);
  };

  const onCheckForUser = async (form: any) => {
    setErrorMessage("");
    const userType = await checkForUser(form.email);

    switch (userType) {
      case "USER_PASSWORD_ONLY":
        setStep(Step.SIGNIN_PASSWORD);
        break;
      case "USER_WITH_BIOMETRIC_DEVICE":
        setStep(Step.SIGNIN_BIOMETRIC);
        setTitle("Attempting biometric login");
        break;

      case "NO_USER":
      default:
        setStep(Step.REGISTER_USER);
        setTitle("Register account");
        break;
    }
  };

  const onFormError = (e: any) => {
    if (!!e.email) {
      setErrorMessage(e.email.message);
    }
    if (!!e.password) {
      setErrorMessage(e.password.message);
    }
  };

  return (
    <>
      <div className="flex min-h-full">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <img
                className="mx-auto h-12 w-auto"
                src="https://prvgrpprd.wpenginepowered.com/wp-content/uploads/2022/03/provisions-group-logo.png"
                alt="Provisions Group"
              />
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                {title}
              </h2>
            </div>

            {(step == Step.SIGNIN_BIOMETRIC ||
              step == Step.REGISTER_BIOMETRIC_DEVICE) && (
              <div className="mt-6">
                <Spinner />
              </div>
            )}

            {step != Step.SIGNIN_BIOMETRIC &&
              step != Step.REGISTER_BIOMETRIC_DEVICE && (
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" action="#" method="POST">
                      {!!errorMessage && (
                        <div>
                          <p className="mt-2 text-center text-sm text-red-600">
                            {errorMessage}
                          </p>
                        </div>
                      )}

                      {step == Step.FIND_USER && (
                        <>
                          <EmailInput methods={methods} />

                          <MainButton
                            onClick={handleSubmit(onCheckForUser, onFormError)}
                            title="Next"
                          />
                        </>
                      )}

                      {step == Step.REGISTER_USER && (
                        <>
                          <EmailInput methods={methods} />
                          <PasswordInput methods={methods} />

                          {webAuthnSupported && (
                            <UseBiometricInput methods={methods} />
                          )}

                          {!webAuthnSupported && (
                            <div>
                              <label
                                htmlFor="useBiometric"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                This browser does not support WebAuthn
                              </label>
                            </div>
                          )}

                          <MainButton
                            onClick={handleSubmit(onSignUp, onFormError)}
                            title="Sign up"
                          />
                        </>
                      )}

                      {step == Step.SIGNIN_PASSWORD && (
                        <>
                          <EmailInput methods={methods} />
                          <PasswordInput methods={methods} />

                          {webAuthnSupported && (
                            <UseBiometricInput methods={methods} />
                          )}

                          {!webAuthnSupported && (
                            <div>
                              <label
                                htmlFor="useBiometric"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                This browser does not support WebAuthn
                              </label>
                            </div>
                          )}

                          <MainButton
                            onClick={handleSubmit(onSignIn, onFormError)}
                            title="Sign in"
                          />
                        </>
                      )}
                    </form>
                  </div>
                </div>
              )}

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a
                    onClick={onStartOver}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Start over
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1505904267569-f02eaeb45a4c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
            alt=""
          />
        </div>
      </div>
    </>
  );
}
