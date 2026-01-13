export const FIELD_ERROR_MESSAGES = {
  invalidEmail: "Please enter a valid email address.",
  weakPassword: "Password must be at least 6 characters.",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string, requiredMessage: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return requiredMessage;
  }
  if (!emailRegex.test(trimmed)) {
    return FIELD_ERROR_MESSAGES.invalidEmail;
  }
  return "";
};

export const validatePassword = (value: string, requiredMessage: string) => {
  if (!value.trim()) {
    return requiredMessage;
  }
  if (value.length < 6) {
    return FIELD_ERROR_MESSAGES.weakPassword;
  }
  return "";
};
