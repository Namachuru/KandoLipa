import { runJamCompetition } from "./jamDispatchEngine";
import { getDistance } from "./getDistance";
import { calculateFare } from "./fareEngine";
//import { getCountryFromCoords } from "./geocodingService";

export const generateRideOptions = async ({
   drivers,
   userLocation,
   destination
}) => {

   const types = ["Mchoro", "Roka", "Wea", "Zoa"];
   const rideOptions = {};
   
   for (const type of types) {
      // ---------------------------------
      const eligible = drivers.filter(d =>
         d.flags?.banned === false &&
         d.flags?.confirmed === true &&
         d.status?.online === true &&
         d.status?.state === "available" &&
         d.vehicle?.has_vehicle === true &&
         d.vehicle?.class === type
      );
      
      console.log("TYPE:", type);
      console.log("ELIGIBLE:", eligible);
      
      if (eligible.length === 0) continue;

      // ---------------------------------
      // COMPUTE REAL-TIME DISTANCE
      // ---------------------------------
      const enriched = eligible.map(d => {

         const distance = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            d.location.lat,
            d.location.lng
         );

         return {
            ...d,
            distance
         };
      });

      // ---------------------------------
      // RUN JAM COMPETITION ENGINE
      // ---------------------------------
      const result = runJamCompetition({
         drivers: fareEligible,
         userLocation,
         destination
      });
      console.log("JAM RESULT:", result);
      const winner = result.winners?.[0];
      console.log("WINNER:", winner);
      if (!winner) continue;

      // ---------------------------------
      // WINNER METRICS
      // ---------------------------------
      const pickupDistance = winner.distance;
      const pickupEta = Math.ceil(pickupDistance * 3);

      const tripDistance = getDistance(
         userLocation.latitude,
         userLocation.longitude,
         destination.latitude,
         destination.longitude
      );


      const tripEta = Math.ceil(tripDistance * 3);
      
      const countryCode = "TZ";

      const fare = calculateFare({
         countryCode,
         type,
         distanceKm: tripDistance,
         durationMin: tripEta,
      });
      console.log("FARE CHECK:", {
   type,
   tripDistance,
   tripEta,
   fare
});
      const fareAmount = fare.fare;

      const fareEligible =
   enriched.filter(driver => {

      const minPrice =
         driver.status?.min_price || 0;

      return fareAmount >= minPrice;
   });

      // ---------------------------------
      // BUILD RIDE OPTION
      // ---------------------------------
      rideOptions[type] = {
         type,
         winner,
         backup: result.winners?.slice(1) ||[],
         competitorIds: result.competitorIds || [],
         pickupDistance,
         pickupEta,
         tripDistance,
         tripEta,
         fare: fare?.fare ?? 0
      };
   }

   console.log("FINAL RIDE OPTIONS:", rideOptions);

   return rideOptions;
};