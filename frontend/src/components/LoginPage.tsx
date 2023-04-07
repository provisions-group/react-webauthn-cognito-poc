import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import Toggle from "./Toggle";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import Spinner from "./Spinner";

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

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      useBiometric: false,
    },
    delayError: 200,
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!!error) {
      setErrorMessage(error);
    }
  }, [error]);

  const email = watch("email");

  useEffect(() => {
    if (step === Step.SIGNIN_BIOMETRIC) {
      signInWebAuthn(email);
    }

    if (step === Step.REGISTER_BIOMETRIC_DEVICE) {
      _signUpWebAuthn();
    }
  }, [step]);

  const _signUpWebAuthn = async () => {
    try {
      await signUpWebAuthn(email);
      setStep(Step.FIND_USER); // to trigger the user to click "next" again.
      setTitle("Login with biometrics");
    } catch (error) {
      console.log("error:", error);
    }
  };

  const onSignIn = async (form: any) => {
    if (webAuthnSupported && form.useBiometric) {
      setTitle("Register biometric device");
      setStep(Step.REGISTER_BIOMETRIC_DEVICE);
      setValue("password", "");
    } else {
      await signIn(form);
    }
  };

  const onSignUp = async (form: any) => {
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
    setTitle("Sign in to your account");
    setValue("email", "");
    setValue("password", "");
    setValue("useBiometric", false);
  };

  const onCheckForUser = async (form: any) => {
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
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
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
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Email address
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="email"
                            control={control}
                            rules={{
                              required: {
                                value: true,
                                message: "Email is required",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <input
                                value={value}
                                onChange={onChange}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={handleSubmit(onCheckForUser, onFormError)}
                          type="button"
                          className="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}

                  {step == Step.REGISTER_USER && (
                    <>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Email address
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="email"
                            control={control}
                            rules={{
                              required: {
                                value: true,
                                message: "Email is required",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <input
                                value={value}
                                onChange={onChange}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Password
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="password"
                            control={control}
                            rules={{
                              required: {
                                value: true,
                                message: "Password is required",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <input
                                value={value}
                                onChange={onChange}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            )}
                          />
                        </div>
                      </div>

                      {webAuthnSupported && (
                        <div>
                          <div className="mt-2">
                            <Controller
                              name="useBiometric"
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <Toggle
                                  label="Use Biometric Login"
                                  description="This browser supports WebAuthn"
                                  onChange={onChange}
                                  value={value}
                                />
                              )}
                            />
                          </div>
                        </div>
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

                      <div>
                        <button
                          onClick={handleSubmit(onSignUp, onFormError)}
                          type="button"
                          className="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Sign up
                        </button>
                      </div>
                    </>
                  )}

                  {step == Step.SIGNIN_PASSWORD && (
                    <>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Email address
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="email"
                            control={control}
                            rules={{
                              required: {
                                value: true,
                                message: "Email is required",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <input
                                value={value}
                                onChange={onChange}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Password
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="password"
                            control={control}
                            rules={{
                              required: {
                                value: true,
                                message: "Password is required",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <input
                                value={value}
                                onChange={onChange}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            )}
                          />
                        </div>
                      </div>

                      {webAuthnSupported && (
                        <div>
                          <div className="mt-2">
                            <Controller
                              name="useBiometric"
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <Toggle
                                  label="Use Biometric Login"
                                  description="This browser supports WebAuthn"
                                  onChange={onChange}
                                  value={value}
                                />
                              )}
                            />
                          </div>
                        </div>
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

                      <div>
                        <button
                          onClick={handleSubmit(onSignIn, onFormError)}
                          type="button"
                          className="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Sign in
                        </button>
                      </div>
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
    </>
  );
}
