import TextInput, { type TextInputProps } from "@/components/ui/text-input";

export type AuthFieldProps = TextInputProps;

export default function AuthField(props: AuthFieldProps) {
  return <TextInput {...props} />;
}
