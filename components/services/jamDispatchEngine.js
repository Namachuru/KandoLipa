import { getDistance } from "../../functions/getDistance";

export const runJamCompetition = ({
   drivers,
   userLocation,
   destination
}) => {

   // We work on a copy to avoid mutating original DB objects directly
   const updatedDrivers = drivers.map(d => ({
      ...d,
      stats: { ...d.stats }
   }));

   // ----------------------------
   // 1. DISTANCE COMPETITION (+45)
   // ----------------------------
   let bestDistance = Infinity;
   let distanceCandidates = [];

   updatedDrivers.forEach(d => {

      const dist = getDistance(
         userLocation.latitude,
         userLocation.longitude,
         d.location.lat,
         d.location.lng
      );

      d._distance = dist; // store for later use
      
      if (dist < bestDistance) {
         bestDistance = dist;
         distanceCandidates = [d];
      } 
      else if (dist === bestDistance) {
         distanceCandidates.push(d);
      }
   });

   const distanceWinner =
      distanceCandidates[Math.floor(Math.random() * distanceCandidates.length)];

   if (distanceWinner) {
      distanceWinner.stats.jam_minutes += 45;
   }

   // ----------------------------
   // 2. ACCEPTANCE (+35)
   // ----------------------------
   let bestAcc = -Infinity;
   let accCandidates = [];

   updatedDrivers.forEach(d => {

      const total = (d.stats.accepted || 0) + (d.stats.denied || 0);
      const acc = total ? (d.stats.accepted / total) * 100 : 0;

      if (acc > bestAcc) {
         bestAcc = acc;
         accCandidates = [d];
      } 
      else if (acc === bestAcc) {
         accCandidates.push(d);
      }
   });

   const accWinner =
      accCandidates[Math.floor(Math.random() * accCandidates.length)];

   if (accWinner) {
      accWinner.stats.jam_minutes += 35;
   }

   // ----------------------------
   // 3. RATING (+25)
   // ----------------------------
   let bestRating = -Infinity;
   let ratingCandidates = [];

   updatedDrivers.forEach(d => {

      const rating = d.stats.rating || 0;

      if (rating > bestRating) {
         bestRating = rating;
         ratingCandidates = [d];
      } 
      else if (rating === bestRating) {
         ratingCandidates.push(d);
      }
   });

   const ratingWinner =
      ratingCandidates[Math.floor(Math.random() * ratingCandidates.length)];

   if (ratingWinner) {
      ratingWinner.stats.jam_minutes += 25;
   }

   // ----------------------------
   // 4. NEW DRIVER (+20)
   // ----------------------------
   let bestNew = Infinity;
   let newCandidates = [];

   updatedDrivers.forEach(d => {

      const total = (d.stats.accepted || 0) + (d.stats.denied || 0);

      if (total < bestNew) {
         bestNew = total;
         newCandidates = [d];
      } 
      else if (total === bestNew) {
         newCandidates.push(d);
      }
   });

   const newWinner =
      newCandidates[Math.floor(Math.random() * newCandidates.length)];

   if (newWinner) {
      newWinner.stats.jam_minutes += 20;
   }

   // ----------------------------
   // 5. FAST RESPONSE (+15)
   // ----------------------------
   let bestSpeed = Infinity;
   let speedCandidates = [];

   updatedDrivers.forEach(d => {

      const speed = d.stats.accept_speed || 999;

      if (speed < bestSpeed) {
         bestSpeed = speed;
         speedCandidates = [d];
      } 
      else if (speed === bestSpeed) {
         speedCandidates.push(d);
      }
   });

   const speedWinner =
      speedCandidates[Math.floor(Math.random() * speedCandidates.length)];

   if (speedWinner) {
      speedWinner.stats.jam_minutes += 15;
   }

   // ----------------------------
// 6. DESTINATION MATCH BONUS
// ----------------------------
updatedDrivers.forEach(d => {

   if (
      d.status?.destination === true &&
      destination
   ) {

      const destDistance = getDistance(
         destination.latitude,
         destination.longitude,
         d.status.dest_lat,
         d.status.dest_lng
      );

      // Driver heading same direction
      if (destDistance < 5) {
         d.stats.jam_minutes += 80;
      }

      // Very close destination
      if (destDistance < 2) {
         d.stats.jam_minutes += 120;
      }
   }
});

   // ----------------------------
   // FINAL RANKING
   // ----------------------------
   updatedDrivers.sort(
      (a, b) => b.stats.jam_minutes - a.stats.jam_minutes
   );

   const winners = updatedDrivers.slice(0, 3);

   const competitorIds =
   updatedDrivers.map(
      d => d.mp_id
   );

   return {
      winners,
      competitorIds,
      drivers: updatedDrivers
   };
};