import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

const getAvailableDriversFn = httpsCallable(
   functions,
   "getAvailableDrivers"
);

export const getAvailableDrivers = async ({ userLocation }) => {
   const result = await getAvailableDriversFn({
      userLocation,
   });

   return result.data.drivers;
};
