let phoneConfirmation = null;

export const setPhoneConfirmation = (confirmation) => {
  phoneConfirmation = confirmation;
};

export const getPhoneConfirmation = () => {
  return phoneConfirmation;
};

export const clearPhoneConfirmation = () => {
  phoneConfirmation = null;
};