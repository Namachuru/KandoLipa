const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  setGlobalOptions,
} = require("firebase-functions/v2");

const {
  lipaDb,
  faidaDb,
} = require("./firebaseAdmin");

const {
  countries,
} = require("./data/countries");

const {
  getAvailableDrivers,
} = require("./driverService");

const {
  generateRideOptions,
} = require("./rideMatchingEngine");

const {
  calculateFare,
} = require("./fareEngine");


setGlobalOptions({
  maxInstances: 10,
});


// ============================================================
// GET COUNTRIES
// ============================================================

exports.getCountries = onCall(async () => {
  return countries;
});


// ============================================================
// GET AVAILABLE DRIVERS
// ============================================================

exports.getAvailableDrivers = onCall(async (request) => {
  console.log(
      "🔥 getAvailableDrivers callable started",
  );

  try {
    const {
      userLocation,
    } = request.data;


    console.log(
        "📍 User location:",
        userLocation,
    );


    if (!userLocation) {
      throw new HttpsError(
          "invalid-argument",
          "User location is required",
      );
    }


    const drivers =
      await getAvailableDrivers(
          userLocation,
      );


    console.log(
        "🚗 Drivers found:",
        drivers.length,
    );


    return {
      drivers,
    };
  } catch (error) {
    console.log(
        "❌ GET AVAILABLE DRIVERS ERROR:",
        error,
    );


    if (error instanceof HttpsError) {
      throw error;
    }


    throw new HttpsError(
        "internal",
        error.message ||
        "Unable to get available drivers",
    );
  }
});


// ============================================================
// MATCH DRIVER
// ============================================================

exports.matchDriver = onCall(async (request) => {
  console.log(
      "🔥 matchDriver callable started",
  );


  try {
    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    console.log(
        "🔥 Checking authentication",
    );


    if (!request.auth) {
      console.log(
          "❌ No authenticated passenger",
      );


      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }


    console.log(
        "✅ Passenger authenticated:",
        request.auth.uid,
    );


    // --------------------------------------------------------
    // GET REQUEST DATA
    // --------------------------------------------------------

    const {
      userLocation,
      destination,
    } = request.data;


    console.log(
        "📍 User location:",
        userLocation,
    );


    console.log(
        "📍 Destination:",
        destination,
    );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!userLocation || !destination) {
      throw new HttpsError(
          "invalid-argument",
          "Location and destination are required",
      );
    }


    // --------------------------------------------------------
    // FIND DRIVERS
    // --------------------------------------------------------

    console.log(
        "🔥 Finding available drivers",
    );


    const drivers =
      await getAvailableDrivers(
          userLocation,
      );


    console.log(
        `🚕 Drivers found: ${drivers.length}`,
    );


    // --------------------------------------------------------
    // GENERATE RIDE OPTIONS
    // --------------------------------------------------------

    const options =
      await generateRideOptions({
        drivers,
        userLocation,
        destination,
      });


    console.log(
        "✅ Ride options generated",
    );


    return options;
  } catch (error) {
    console.log(
        "❌ MATCH DRIVER ERROR:",
        error,
    );


    if (error instanceof HttpsError) {
      throw error;
    }


    throw new HttpsError(
        "internal",
        error.message ||
        "Unable to match driver",
    );
  }
});


// ============================================================
// REQUEST RIDE
// ============================================================

exports.requestRide = onCall(async (request) => {
  console.log(
      "🔥 requestRide callable started",
  );


  try {
    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    if (!request.auth) {
      console.log(
          "❌ requestRide: passenger not authenticated",
      );


      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }


    const passengerId =
      request.auth.uid;


    console.log(
        "👤 PASSENGER ID:",
        passengerId,
    );


    // --------------------------------------------------------
    // GET REQUEST DATA
    // --------------------------------------------------------

    const {
      userLocation,
      clientLocation,
      destination,
      selectedRide,
      rideData,
    } = request.data || {};


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!userLocation || !destination) {
      throw new HttpsError(
          "invalid-argument",
          "Location and destination are required",
      );
    }


    if (
      !clientLocation ||
      clientLocation.lat == null ||
      clientLocation.lng == null
    ) {
      throw new HttpsError(
          "invalid-argument",
          "Client location is required",
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


    // --------------------------------------------------------
    // GET WINNING DRIVER
    // --------------------------------------------------------

    const winner =
      rideData.winner;


    if (!winner || !winner.mp_id) {
      throw new HttpsError(
          "not-found",
          "No available driver",
      );
    }


    console.log(
        "🏆 WINNER:",
        winner.full_name,
    );


    console.log(
        "🚗 DRIVER ID:",
        winner.mp_id,
    );


    // --------------------------------------------------------
    // CREATE REQUEST ID
    // --------------------------------------------------------

    const requestRef =
      lipaDb
          .ref(
              `KandoLipa/clients/${passengerId}/ride_requests`,
          )
          .push();


    const requestId =
      requestRef.key;


    if (!requestId) {
      throw new HttpsError(
          "internal",
          "Failed to create request ID",
      );
    }


    console.log(
        "🆔 REQUEST ID:",
        requestId,
    );


    // --------------------------------------------------------
    // SERVER CREATION TIME
    // --------------------------------------------------------

    const createdAt =
      Date.now();


    // ========================================================
    // KANDOLIPA REQUEST
    // ========================================================

    const rideRequest = {

      request_id:
        requestId,

      client_id:
        passengerId,

      mp_id:
        winner.mp_id,

      type:
        selectedRide,

      pickup:
        userLocation,

      client_location: {
        lat:
          Number(
              clientLocation.lat,
          ),
        lng:
          Number(
              clientLocation.lng,
          ),
      },

      destination,

      fare:
        rideData.fare,

      pickupEta:
        rideData.pickupEta,

      tripEta:
        rideData.tripEta,

      status:
        "pending",

      created_at:
        createdAt,

      trip_started_at:
        null,

      trip_completed_at:
        null,

    };


    await requestRef.set(
        rideRequest,
    );


    console.log(
        "🚕 KandoLipa RIDE REQUEST CREATED:",
        requestId,
    );


    // ========================================================
    // KANDOFAIDA DRIVER REQUEST
    // ========================================================

    const driverRequestRef =
      faidaDb.ref(
          `KandoFaida/mobility_partners/${winner.mp_id}` +
          `/ride_requests/${requestId}`,
      );


    const driverRequest = {

      request_id:
        requestId,

      client_id:
        passengerId,

      mp_id:
        winner.mp_id,

      pickup:
        userLocation,

      client_location: {
        lat:
          Number(
              clientLocation.lat,
          ),
        lng:
          Number(
              clientLocation.lng,
          ),
      },

      destination,

      type:
        selectedRide,

      fare:
        rideData.fare,

      pickupEta:
        rideData.pickupEta,

      tripEta:
        rideData.tripEta,

      status:
        "pending",

      created_at:
        createdAt,

      trip_started_at:
        null,

      trip_completed_at:
        null,

    };


    await driverRequestRef.set(
        driverRequest,
    );


    console.log(
        "📨 DRIVER RIDE REQUEST CREATED:",
        requestId,
    );


    console.log(
        "🚗 DRIVER:",
        winner.mp_id,
    );


    console.log(
        "⏳ DRIVER REQUEST STATUS: pending",
    );


    // ========================================================
    // VERIFY KANDOFAIDA REQUEST
    // ========================================================

    const driverRequestSnapshot =
      await driverRequestRef.once(
          "value",
      );


    const driverRequestData =
      driverRequestSnapshot.val();


    console.log(
        "🔎 DRIVER REQUEST AFTER WRITE:",
        driverRequestData,
    );


    if (!driverRequestData) {
      throw new HttpsError(
          "internal",
          "Driver request was not created",
      );
    }


    // ========================================================
    // FINAL RESPONSE
    // ========================================================

    return {

      success:
        true,

      request_id:
        requestId,

      mp_id:
        winner.mp_id,

      selectedRide,

      fare:
        rideData.fare,

      pickupEta:
        rideData.pickupEta,

      tripEta:
        rideData.tripEta,

    };
  } catch (error) {
    console.error(
        "❌ REQUEST RIDE ERROR:",
        error,
    );


    if (error instanceof HttpsError) {
      throw error;
    }


    throw new HttpsError(
        "internal",
        error.message ||
        "Unable to create ride request",
    );
  }
});


// ============================================================
// START TRIP
// ============================================================
//
// Called by DriverApproaching when the driver reaches pickup.
//
// IMPORTANT:
// The timestamp is generated INSIDE the Cloud Function.
// The passenger's phone does not control the trip start time.
//
// ============================================================

exports.startTrip = onCall(async (request) => {
  console.log(
      "🔥 startTrip callable started",
  );


  try {
    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    if (!request.auth) {
      console.log(
          "❌ startTrip: unauthenticated",
      );


      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }


    // --------------------------------------------------------
    // GET DATA
    // --------------------------------------------------------

    const {
      requestId,
      mpId,
    } = request.data || {};


    console.log(
        "🆔 REQUEST ID:",
        requestId,
    );


    console.log(
        "🚗 MP ID:",
        mpId,
    );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!requestId) {
      throw new HttpsError(
          "invalid-argument",
          "Request ID is required",
      );
    }


    if (!mpId) {
      throw new HttpsError(
          "invalid-argument",
          "MP ID is required",
      );
    }


    const passengerId =
      request.auth.uid;


    // --------------------------------------------------------
    // GET KANDOLIPA REQUEST
    // --------------------------------------------------------

    const requestRef =
      lipaDb.ref(
          `KandoLipa/clients/${passengerId}/ride_requests/${requestId}`,
      );


    const requestSnapshot =
      await requestRef.once(
          "value",
      );


    const rideRequest =
      requestSnapshot.val();


    if (!rideRequest) {
      throw new HttpsError(
          "not-found",
          "Ride request not found",
      );
    }


    // --------------------------------------------------------
    // VERIFY DRIVER
    // --------------------------------------------------------

    if (
      String(rideRequest.mp_id) !==
      String(mpId)
    ) {
      throw new HttpsError(
          "permission-denied",
          "This driver is not assigned to this ride",
      );
    }


    // --------------------------------------------------------
    // PREVENT STARTING TWICE
    // --------------------------------------------------------

    if (
      rideRequest.trip_started_at
    ) {
      console.log(
          "⚠️ TRIP ALREADY STARTED",
      );


      return {

        success:
          true,

        alreadyStarted:
          true,

        trip_started_at:
          rideRequest.trip_started_at,

      };
    }


    // --------------------------------------------------------
    // SERVER TIME
    // --------------------------------------------------------

    const tripStartedAt =
      Date.now();


    console.log(
        "⏱️ SERVER TRIP START TIME:",
        tripStartedAt,
    );


    // ========================================================
    // UPDATE KANDOLIPA
    // ========================================================

    await requestRef.update({

      status:
        "in_progress",

      trip_started_at:
        tripStartedAt,

    });


    console.log(
        "✅ KANDOLIPA TRIP STARTED",
    );


    // ========================================================
    // UPDATE KANDOFAIDA
    // ========================================================

    const driverRequestRef =
      faidaDb.ref(
          `KandoFaida/mobility_partners/${mpId}` +
          `/ride_requests/${requestId}`,
      );


    await driverRequestRef.update({

      status:
        "in_progress",

      trip_started_at:
        tripStartedAt,

    });


    console.log(
        "✅ KANDOFAIDA TRIP STARTED",
    );


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return {

      success:
        true,

      request_id:
        requestId,

      mp_id:
        mpId,

      trip_started_at:
        tripStartedAt,

    };
  } catch (error) {
    console.log(
        "❌ START TRIP ERROR:",
        error,
    );


    if (error instanceof HttpsError) {
      throw error;
    }


    throw new HttpsError(
        "internal",
        error.message ||
        "Unable to start trip",
    );
  }
});


// ============================================================
// COMPLETE TRIP
// ============================================================
//
// IMPORTANT:
//
// The client DOES NOT send actualMinutes anymore.
//
// The server gets:
//     trip_started_at
//
// Then creates:
//     trip_completed_at
//
// And calculates:
//
//     actualMinutes =
//       (trip_completed_at - trip_started_at) / 60000
//
// ============================================================

exports.completeTrip = onCall(async (request) => {
  console.log(
      "🔥 completeTrip callable started",
  );


  try {
    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    if (!request.auth) {
      console.log(
          "❌ completeTrip: unauthenticated",
      );


      throw new HttpsError(
          "unauthenticated",
          "User must be logged in",
      );
    }


    // --------------------------------------------------------
    // GET DATA
    // --------------------------------------------------------

    const {
      requestId,
      mpId,
      driverId,
      rideType,
      actualDistanceKm,
    } = request.data || {};


    console.log(
        "🆔 REQUEST ID:",
        requestId,
    );


    console.log(
        "🚗 MP ID:",
        mpId,
    );


    console.log(
        "🚗 DRIVER ID:",
        driverId,
    );


    console.log(
        "🚕 RIDE TYPE:",
        rideType,
    );


    console.log(
        "📏 ACTUAL DISTANCE:",
        actualDistanceKm,
    );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!requestId) {
      throw new HttpsError(
          "invalid-argument",
          "Request ID is required",
      );
    }


    if (!mpId) {
      throw new HttpsError(
          "invalid-argument",
          "MP ID is required",
      );
    }


    if (!rideType) {
      throw new HttpsError(
          "invalid-argument",
          "Ride type is required",
      );
    }


    if (
      actualDistanceKm == null ||
      !Number.isFinite(
          Number(actualDistanceKm),
      )
    ) {
      throw new HttpsError(
          "invalid-argument",
          "Actual distance is required",
      );
    }


    // --------------------------------------------------------
    // PASSENGER
    // --------------------------------------------------------

    const passengerId =
      request.auth.uid;


    // --------------------------------------------------------
    // GET KANDOLIPA REQUEST
    // --------------------------------------------------------

    const requestRef =
      lipaDb.ref(
          `KandoLipa/clients/${passengerId}/ride_requests/${requestId}`,
      );


    const requestSnapshot =
      await requestRef.once(
          "value",
      );


    const rideRequest =
      requestSnapshot.val();


    if (!rideRequest) {
      throw new HttpsError(
          "not-found",
          "Ride request not found",
      );
    }


    // --------------------------------------------------------
    // VERIFY DRIVER
    // --------------------------------------------------------

    if (
      String(rideRequest.mp_id) !==
      String(mpId)
    ) {
      throw new HttpsError(
          "permission-denied",
          "This driver is not assigned to this ride",
      );
    }


    // --------------------------------------------------------
    // GET SERVER START TIME
    // --------------------------------------------------------

    const tripStartedAt =
      Number(
          rideRequest.trip_started_at,
      );


    if (
      !Number.isFinite(
          tripStartedAt,
      )
    ) {
      throw new HttpsError(
          "failed-precondition",
          "Trip has not been started",
      );
    }


    console.log(
        "⏱️ SERVER TRIP START:",
        tripStartedAt,
    );


    // --------------------------------------------------------
    // PREVENT DOUBLE COMPLETION
    // --------------------------------------------------------

    if (
      rideRequest.trip_completed_at
    ) {
      console.log(
          "⚠️ TRIP ALREADY COMPLETED",
      );


      return {

        success:
          true,

        alreadyCompleted:
          true,

        finalFare:
          Number(
              rideRequest.finalFare || 0,
          ),

        actualDistanceKm:
          Number(
              rideRequest.actualDistanceKm || 0,
          ),

        actualMinutes:
          Number(
              rideRequest.actualMinutes || 0,
          ),

        tripId:
          rideRequest.trip_id || null,

      };
    }


    // --------------------------------------------------------
    // SERVER COMPLETION TIME
    // --------------------------------------------------------

    const tripCompletedAt =
      Date.now();


    console.log(
        "⏱️ SERVER TRIP COMPLETION:",
        tripCompletedAt,
    );


    // --------------------------------------------------------
    // SERVER DURATION
    // --------------------------------------------------------

    const actualMinutes =
      Math.max(
          0,
          (
            tripCompletedAt -
            tripStartedAt
          ) / 60000,
      );


    console.log(
        "⏱️ ACTUAL TRIP MINUTES:",
        actualMinutes,
    );


    // --------------------------------------------------------
    // DISTANCE
    // --------------------------------------------------------

    const distanceKm =
      Math.max(
          0,
          Number(actualDistanceKm),
      );


    console.log(
        "📏 FINAL DISTANCE:",
        distanceKm,
        "km",
    );


    // ========================================================
    // CALCULATE FINAL FARE
    // ========================================================

    const fareResult =
      calculateFare({

        countryCode:
          "TZ",

        type:
          rideType,

        distanceKm:
          distanceKm,

        durationMin:
          actualMinutes,

      });


    console.log(
        "💰 FINAL FARE:",
        fareResult.fare,
    );


    // ========================================================
    // CREATE TRIP
    // ========================================================

    const tripRef =
      lipaDb
          .ref(
              "KandoLipa/trips",
          )
          .push();


    const tripId =
      tripRef.key;


    if (!tripId) {
      throw new HttpsError(
          "internal",
          "Failed to create trip ID",
      );
    }


    const tripData = {

      trip_id:
        tripId,

      request_id:
        requestId,

      client_id:
        passengerId,

      mp_id:
        mpId,

      driver_id:
        driverId || mpId,

      rideType,

      distanceKm:
        distanceKm,

      durationMin:
        actualMinutes,

      fare:
        fareResult.fare,

      currency:
        "TZS",

      status:
        "completed",

      trip_started_at:
        tripStartedAt,

      trip_completed_at:
        tripCompletedAt,

      created_at:
        tripStartedAt,

    };


    await tripRef.set(
        tripData,
    );


    console.log(
        "✅ TRIP SAVED:",
        tripId,
    );


    // ========================================================
    // UPDATE KANDOLIPA REQUEST
    // ========================================================

    await requestRef.update({

      status:
        "completed",

      trip_completed_at:
        tripCompletedAt,

      actualDistanceKm:
        distanceKm,

      actualMinutes:
        actualMinutes,

      finalFare:
        fareResult.fare,

      trip_id:
        tripId,

    });


    console.log(
        "✅ KANDOLIPA REQUEST COMPLETED",
    );


    // ========================================================
    // UPDATE KANDOFAIDA REQUEST
    // ========================================================

    const driverRequestRef =
      faidaDb.ref(
          `KandoFaida/mobility_partners/${mpId}` +
          `/ride_requests/${requestId}`,
      );


    await driverRequestRef.update({

      status:
        "completed",

      trip_completed_at:
        tripCompletedAt,

      actualDistanceKm:
        distanceKm,

      actualMinutes:
        actualMinutes,

      finalFare:
        fareResult.fare,

      trip_id:
        tripId,

    });


    console.log(
        "✅ KANDOFAIDA REQUEST COMPLETED",
    );


    // ========================================================
    // UPDATE DRIVER STATE
    // ========================================================

    const driverStateRef =
      faidaDb.ref(
          `KandoFaida/mobility_partners/${mpId}/status/state`,
      );


    await driverStateRef.set(
        "completed",
    );


    console.log(
        "🏁 DRIVER STATE: completed",
    );


    // --------------------------------------------------------
    // RETURN DRIVER TO AVAILABLE
    // --------------------------------------------------------

    await driverStateRef.set(
        "available",
    );


    console.log(
        "🚗 DRIVER STATE: available",
    );


    // ========================================================
    // RESPONSE
    // ========================================================

    return {

      success:
        true,

      tripId:
        tripId,

      requestId:
        requestId,

      finalFare:
        fareResult.fare,

      currency:
        "TZS",

      actualDistanceKm:
        distanceKm,

      actualMinutes:
        actualMinutes,

      tripStartedAt:
        tripStartedAt,

      tripCompletedAt:
        tripCompletedAt,

    };
  } catch (error) {
    console.log(
        "❌ COMPLETE TRIP ERROR:",
        error,
    );


    if (error instanceof HttpsError) {
      throw error;
    }


    throw new HttpsError(
        "internal",
        error.message ||
        "Unable to complete trip",
    );
  }
});
