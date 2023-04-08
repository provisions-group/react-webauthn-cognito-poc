import { Controller, UseFormReturn } from "react-hook-form";

export interface EmailInputProps {
  methods: UseFormReturn<
    {
      email: string;
      password: string;
      useBiometric: boolean;
    },
    any
  >;
}

export default function EmailInput({ methods }: EmailInputProps) {
  const { control } = methods;

  return (
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
  );
}
