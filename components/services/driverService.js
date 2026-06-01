import { ref, get } from "firebase/database";
import { faidaDb } from "../../firebase/firebase";
import { getDistance } from "./getDistance";

export const getAvailableDrivers = async ({
   userLocation
}) => {

   try {

      if (!userLocation) {
         return [];
      }

      const snapshot = await get(
         ref(faidaDb, "KandoFaida/mobility_partners")
      );

      console.log("SNAPSHOT EXISTS:", snapshot.exists());
      console.log("RAW DATA:", snapshot.val());
      
      if (!snapshot.exists()) {
         return [];
      }

      const data = snapshot.val();

      const drivers = [];

      Object.keys(data).forEach(key => {

         const driver = data[key];

         if (
            driver.partner_type !== "vehicle" ||
            driver.flags?.banned !== false ||
            driver.flags?.confirmed !== true ||
            driver.status?.online !== true ||
            driver.status?.state !== "available" ||
            driver.vehicle?.has_vehicle !== true
         ) {

            console.log("FILTER FAILED:", {
               partnerType: driver.partner_type,
               banned: driver.flags?.banned,
               confirmed: driver.flags?.confirmed,
               online: driver.status?.online,
               state: driver.status?.state,
               hasVehicle: driver.vehicle?.has_vehicle,
            });

            return;
         }

         if (
            driver.location?.lat == null ||
            driver.location?.lng == null
         ) {
            return;
         }

         const distance = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            driver.location.lat,
            driver.location.lng
         );

         if (distance > driver.status.pick) {

            console.log("DISTANCE CHECK:", {
               distance,
               pick: driver.status.pick
            });

            return;
         }

         driver.distance = distance;

         drivers.push(driver);
      });

      return drivers;

   } catch (error) {

      console.log("Driver Fetch Error:", error);

      return [];
   }
};