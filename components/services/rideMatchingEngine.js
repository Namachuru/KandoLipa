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

      console.log("BEFORE JAM");
const result = runJamCompetition({
   drivers: enriched,
   userLocation,
   destination
});

console.log("JAM RESULT:", result);

let winner = result.winners?.[0];

if (!winner) continue;

const pickupDistance = winner.distance;
const pickupEta = Math.ceil(pickupDistance * 3);

const tripDistance = getDistance(
   userLocation.latitude,
   userLocation.longitude,
   destination.latitude,
   destination.longitude
);

const tripEta = Math.ceil(tripDistance * 3);

const fareResult = calculateFare({
   countryCode: "TZ",
   type,
   distanceKm: tripDistance,
   durationMin: tripEta,
});

const fareAmount = fareResult.fare;

const fareEligible = enriched.filter(driver => {
   const minPrice = driver.status?.min_price || 0;
   return fareAmount >= minPrice;
});

if (fareEligible.length === 0) {
   console.log(
      "NO DRIVERS ACCEPT THIS FARE",
      type,
      fareAmount
   );
   continue;
}

winner =
   fareEligible.find(
      d => d.mp_id === winner.mp_id
   ) || fareEligible[0];
      console.log("WINNER:", winner.mp_id);
console.log("FARE RESULT:", fareResult);
      // ---------------------------------
      // BUILD RIDE OPTION
      // ---------------------------------
      rideOptions[type] = {
         type,
         winner,
         backupDrivers: result.winners?.slice(1) ||[],
         competitorIds: result.competitorIds || [],
         pickupDistance,
         pickupEta,
         tripDistance,
         tripEta,
         fare: fareResult.fare,
         currency: "TZS",
         available: true
      };

      console.log(
   "RIDE OPTION CREATED:",
   rideOptions[type]
);
   }

   console.log("FINAL RIDE OPTIONS:", JSON.stringify(rideOptions, null, 2));

   return rideOptions;
};