import { Controller, UseFormReturn } from "react-hook-form";

export interface PasswordInputProps {
  methods: UseFormReturn<
    {
      email: string;
      password: string;
      useBiometric: boolean;
    },
    any
  >;
}

export default function PasswordInput({ methods }: PasswordInputProps) {
  const { control } = methods;

  return (
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
  );
}
