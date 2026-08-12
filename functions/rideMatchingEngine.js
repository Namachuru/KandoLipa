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

  for (const type of types) {
    // ---------------------------------
    // FILTER ELIGIBLE DRIVERS
    // ---------------------------------

    const eligible = drivers.filter((d) =>
      d.flags?.banned === false &&
      d.flags?.confirmed === true &&
      d.status?.online === true &&
      d.status?.state === "available" &&
      d.vehicle?.has_vehicle === true &&
      d.vehicle?.class === type,
    );


    console.log(
        "TYPE:",
        type,
        "ELIGIBLE:",
        eligible.length,
    );


    if (eligible.length === 0) {
      continue;
    }


    // ---------------------------------
    // ADD DISTANCE TO EACH DRIVER
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


    // ---------------------------------
    // CHECK PICKUP RANGE
    // ---------------------------------

    const withinRange = enriched.filter((driver) => {
      const pickRange =
        Number(driver.status?.pick) || 0;


      return driver.distance <= pickRange;
    });


    if (withinRange.length === 0) {
      console.log(
          "NO DRIVERS WITHIN RANGE:",
          type,
      );

      continue;
    }


    // ---------------------------------
    // JAM COMPETITION
    // RETURNS ORDERED ARRAY
    // [0] winner
    // [1] backup
    // [2] backup
    // ---------------------------------

    console.log("JAM START:", type, withinRange.length);

    const result = runJamCompetition({
      drivers: withinRange,
      userLocation,
      destination,
    });

    console.log("JAM FINISHED:", type, result);

    const rankedDrivers =
      result.winners || [];


    const winner =
      rankedDrivers[0];


    if (!winner) {
      continue;
    }


    console.log(
        "WINNER:",
        winner.mp_id,
    );


    // ---------------------------------
    // ETA CALCULATIONS
    // ---------------------------------

    const pickupDistance =
      winner.distance;


    const pickupEta =
      Math.ceil(
          pickupDistance * 3,
      );


    const tripDistance =
      getDistance(
          userLocation.latitude,
          userLocation.longitude,
          destination.latitude,
          destination.longitude,
      );


    const tripEta =
      Math.ceil(
          tripDistance * 3,
      );


    // ---------------------------------
    // FARE
    // ---------------------------------

    const fareResult =
      calculateFare({
        countryCode: "TZ",
        type,
        distanceKm: tripDistance,
        durationMin: tripEta,
      });


    if (!fareResult) {
      continue;
    }


    const calculatedFare =
      fareResult.fare;


    const minimumFare =
      Number(winner.status?.min_price) || 0;


    const finalFare =
      Math.max(
          calculatedFare,
          minimumFare,
      );


    // ---------------------------------
    // SAVE OPTION
    // ---------------------------------

    rideOptions[type] = {

      type,


      // complete ranked list
      drivers: rankedDrivers,


      // first driver
      winner: rankedDrivers[0],


      // remaining drivers
      backupDrivers:
        rankedDrivers.slice(1),


      competitorIds:
        result.competitorIds || [],


      pickupDistance,


      pickupEta,


      tripDistance,


      tripEta,


      fare: finalFare,


      currency: "TZS",


      available: true,

    };


    console.log(
        `${type} OPTION CREATED`,
        {
          winner:
            rankedDrivers[0]?.mp_id,

          backups:
            rankedDrivers
                .slice(1)
                .map((d) => d.mp_id),
        },
    );
  }


  console.log(
      "FINAL RIDE OPTIONS:",
      JSON.stringify(
          rideOptions,
          null,
          2,
      ),
  );


  return rideOptions;
};


module.exports = {
  generateRideOptions,
};
