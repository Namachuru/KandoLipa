const {runJamCompetition} = require("./runJamCompetition");
const {getDistance} = require("./getDistance");
const {calculateFare} = require("./fareEngine");

const generateRideOptions = async ({
  drivers,
  userLocation,
  destination,
}) => {
  const types = ["Mchoro", "Roka", "Wea", "Zoa"];
  const rideOptions = {};

  console.log("TOTAL DRIVERS RECEIVED:", drivers.length);

  console.log(
      "DRIVERS:",
      JSON.stringify(
          drivers.map((d) => ({
            id: d.mp_id,
            class: d.vehicle?.class,
            online: d.status?.online,
            state: d.status?.state,
            banned: d.flags?.banned,
            confirmed: d.flags?.confirmed,
            hasVehicle: d.vehicle?.has_vehicle,
          })),
          null,
          2,
      ),
  );

  for (const type of types) {
    // ---------------------------------
    const eligible = drivers.filter((d) =>
      d.flags?.banned === false &&
         d.flags?.confirmed === true &&
         d.status?.online === true &&
         d.status?.state === "available" &&
         d.vehicle?.has_vehicle === true &&
         d.vehicle?.class === type,
    );

    console.log("TYPE:", type);
    console.log("ELIGIBLE:", eligible);

    if (eligible.length === 0) continue;

    // ---------------------------------
    // COMPUTE REAL-TIME DISTANCE
    // ---------------------------------
    const enriched = eligible.map((d) => {
      const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          d.location.lat,
          d.location.lng,
      );

      return {
        ...d,
        distance,
      };
    });

    const withinRange = enriched.filter((driver) => {
      const pickRange =
      Number(driver.status?.pick) || 0;

      const allowed =
      driver.distance <= pickRange;

      console.log(
          "RANGE CHECK:",
          driver.mp_id,
          "distance:",
          driver.distance,
          "pick:",
          pickRange,
          "allowed:",
          allowed,
      );

      return allowed;
    });

    console.log(
        "WITHIN RANGE:",
        withinRange.map((d) => ({
          id: d.mp_id,
          distance: d.distance,
          pick: d.status?.pick,
        })),
    );

    if (withinRange.length === 0) {
      console.log(
          "NO DRIVERS WITHIN PICKUP RANGE:",
          type,
      );

      continue;
    }
    console.log("BEFORE JAM");
    const result = runJamCompetition({
      drivers: withinRange,
      userLocation,
      destination,
    });

    console.log("JAM RESULT:", result);

    const winner = result.winners?.[0];

    if (!winner) continue;

    const pickupDistance = winner.distance;
    const pickupEta = Math.ceil(pickupDistance * 3);

    const tripDistance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        destination.latitude,
        destination.longitude,
    );

    const tripEta = Math.ceil(tripDistance * 3);

    const fareResult = calculateFare({
      countryCode: "TZ",
      type,
      distanceKm: tripDistance,
      durationMin: tripEta,
    });

    if (!fareResult) {
      continue;
    }

    const calculatedFare = fareResult.fare;

    // Driver's minimum fare
    const minimumFare = Number(winner.status?.min_price) || 0;

    // Never charge below the driver's minimum fare
    const finalFare = Math.max(calculatedFare, minimumFare);

    console.log(
        "CALCULATED FARE:",
        calculatedFare,
        "MINIMUM:",
        minimumFare,
        "FINAL:",
        finalFare,
    );

    console.log("WINNER:", winner.mp_id);
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
      fare: finalFare,
      currency: "TZS",
      available: true,
    };

    console.log(
        "RIDE OPTION CREATED:",
        rideOptions[type],
    );
  }

  console.log("FINAL RIDE OPTIONS:", JSON.stringify(rideOptions, null, 2));

  return rideOptions;
};

module.exports = {
  generateRideOptions,
};
