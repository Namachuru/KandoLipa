const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {admin, faidaDb} = require("./firebaseAdmin");

const {countries} = require("./data/countries");
const {getAvailableDrivers} = require("./driverService");
const {generateRideOptions} = require("./rideMatchingEngine");
const {calculateFare} = require("./fareEngine");

setGlobalOptions({
  maxInstances: 10,
});

exports.getCountries = onCall(async () => {
  return countries;
});

exports.getAvailableDrivers = onCall(async (request) => {
  console.log("🔥 getAvailableDrivers callable started");

  try {
    const {userLocation} = request.data;

    console.log("User location:", userLocation);

    if (!userLocation) {
      throw new HttpsError(
          "invalid-argument",
          "User location is required",
      );
    }

    const drivers = await getAvailableDrivers(userLocation);

    console.log("Drivers found:", drivers.length);

    return {drivers};
  } catch (error) {
    throw new HttpsError(
        "internal",
        error.message,
    );
  }
});

exports.matchDriver = onCall(async (request) => {
  console.log("🔥 matchDriver callable started");

  try {
    // -----------------------------
    // AUTH CHECK
    // -----------------------------

    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }

    const {
      userLocation,
      destination,
    } = request.data;


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!userLocation || !destination) {
      throw new HttpsError(
          "invalid-argument",
          "Location and destination are required",
      );
    }

    // -----------------------------
    // FIND DRIVERS
    // -----------------------------

    const drivers = await getAvailableDrivers(
        userLocation,
    );

    console.log(`🚕 Drivers found: ${drivers.length}`);

    // -----------------------------
    // GENERATE RIDE OPTIONS
    // -----------------------------

    const options = await generateRideOptions({

      drivers,

      userLocation,

      destination,

    });

    console.log("✅ Ride options generated");

    return options;
  } catch (error) {
    console.log(
        "MATCH DRIVER ERROR:",
        error,
    );


    throw new HttpsError(

        "internal",

        error.message,

    );
  }
});

exports.requestRide = onCall(async (request) => {
  console.log("🔥 requestRide callable started");

  try {
    // -----------------------------
    // AUTH CHECK
    // -----------------------------
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }

    const passengerId = request.auth.uid;

    const {
      userLocation,
      destination,
      selectedRide,
      rideData,
    } = request.data;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!userLocation || !destination) {
      throw new HttpsError(
          "invalid-argument",
          "Location and destination are required",
      );
    }

    if (!selectedRide) {
      throw new HttpsError(
          "invalid-argument",
          "Ride type is required",
      );
    }

    if (!rideData) {
      throw new HttpsError(
          "invalid-argument",
          "Ride data is required",
      );
    }

    const winner = rideData.winner;

    if (!winner) {
      throw new HttpsError(
          "not-found",
          "No available driver",
      );
    }

    console.log("🏆 WINNER:", winner.full_name);

    // -----------------------------
    // CREATE RIDE REQUEST
    // -----------------------------
    const requestRef = admin
        .database()
        .ref("KandoLipa/ride_requests")
        .push();

    const rideRequest = {
      requestId: requestRef.key,

      passengerId,

      driverId: winner.mp_id,

      type: selectedRide,

      pickup: userLocation,

      destination,

      fare: rideData.fare,

      pickupEta: rideData.pickupEta,

      tripEta: rideData.tripEta,

      status: "pending",

      created_at: Date.now(),
    };

    await requestRef.set(rideRequest);

    console.log(
        "🚕 RIDE REQUEST CREATED:",
        requestRef.key,
    );

    // -----------------------------
    // NOTIFY DRIVER
    // -----------------------------
    await admin
        .database()
        .ref(
            `KandoFaida/mobility_partners/${winner.mp_id}/` +
            `ride_requests/${requestRef.key}`,
        )
        .set({
          requestId: requestRef.key,

          passengerId,

          pickup: userLocation,

          destination,

          type: selectedRide,

          fare: rideData.fare,

          status: "pending",

          created_at: Date.now(),
        });

    console.log("📨 Driver notified");

    return {
      success: true,

      requestId: requestRef.key,

      driverId: winner.mp_id,

      selectedRide,

      fare: rideData.fare,

      pickupEta: rideData.pickupEta,

      tripEta: rideData.tripEta,
    };
  } catch (error) {
    console.log(
        "REQUEST RIDE ERROR:",
        error,
    );

    throw new HttpsError(
        "internal",
        error.message,
    );
  }
});

exports.completeTrip = onCall(async (request) => {
  try {
    const {
      driverId,
      rideType,
      actualDistanceKm,
      actualMinutes,
    } = request.data;

    if (
      !driverId ||
      !rideType ||
      actualDistanceKm == null ||
      actualMinutes == null
    ) {
      throw new HttpsError(
          "invalid-argument",
          "Missing trip data",
      );
    }

    // Calculate fare
    const fareResult = calculateFare({
      countryCode: "TZ",
      type: rideType,
      distanceKm: actualDistanceKm,
      durationMin: actualMinutes,
    });

    // Save trip
    const tripRef = admin
        .database()
        .ref("KandoLipa/trips")
        .push();

    await tripRef.set({
      driverId,
      rideType,
      distanceKm: actualDistanceKm,
      durationMin: actualMinutes,
      fare: fareResult.fare,
      currency: "TZS",
      status: "completed",
      completedAt: Date.now(),
    });

    await faidaDb
        .ref(`KandoFaida/mobility_partners/${driverId}/status/state`)
        .set("completed");

    await faidaDb
        .ref(`KandoFaida/mobility_partners/${driverId}/status/state`)
        .set("available");

    return {
      success: true,
      tripId: tripRef.key,
      finalFare: fareResult.fare,
      currency: "TZS",
      distanceKm: actualDistanceKm,
      durationMin: actualMinutes,
    };
  } catch (err) {
    throw new HttpsError(
        "internal",
        err.message,
    );
  }
});
