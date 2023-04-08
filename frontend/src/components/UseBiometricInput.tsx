import { Controller, UseFormReturn } from "react-hook-form";
import Toggle from "./Toggle";

export interface UseBiometricInputProps {
  methods: UseFormReturn<
    {
      email: string;
      password: string;
      useBiometric: boolean;
    },
    any
  >;
}

export default function UseBiometricInput({ methods }: UseBiometricInputProps) {
  const { control } = methods;

  return (
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
  );
}
