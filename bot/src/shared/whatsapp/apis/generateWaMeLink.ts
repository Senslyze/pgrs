export const generateWaMeLink = (phoneNumber: string, message?: string) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  const cleanedNumber = phoneNumber.replace(/\D/g, "");

  if (!cleanedNumber) {
    throw new Error("Phone number must contain at least one digit");
  }

  const baseUrl = `https://wa.me/${cleanedNumber}`;

  if (!message) {
    return baseUrl;
  }

  const encodedMessage = encodeURIComponent(message);
  return `${baseUrl}?text=${encodedMessage}`;
};
