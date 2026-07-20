const {faidaDb} = require("./firebaseAdmin");
const {getDistance} = require("./getDistance");

const getAvailableDrivers = async (userLocation) => {
  try {
    if (!userLocation) {
      return [];
    }

    console.log("FAIDA DATABASE URL:", faidaDb.app.options.databaseURL);

    const root = await faidaDb.ref("/").get();

    console.log(
        "FAIDA ROOT:",
        JSON.stringify(root.val(), null, 2),
    );

    const snapshot = await faidaDb
        .ref("KandoFaida/mobility_partners")
        .get();

    console.log("SNAPSHOT EXISTS:", snapshot.exists());
    console.log("SNAPSHOT VALUE:", JSON.stringify(snapshot.val(), null, 2));

    if (!snapshot.exists()) {
      console.log("NO DATA FOUND AT KandoFaida/mobility_partners");
      return [];
    }

    const data = snapshot.val();

    console.log("MOBILITY PARTNERS RAW:", JSON.stringify(data, null, 2));

    const drivers = [];

    Object.keys(data).forEach((key) => {
      const driver = data[key];

      if (
        driver.partner_type !== "vehicle" ||
        driver.flags?.banned !== false ||
        driver.flags?.confirmed !== true ||
        driver.status?.online !== true ||
        driver.status?.state !== "available" ||
        driver.vehicle?.has_vehicle !== true
      ) {
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
          driver.location.lng,
      );

      if (distance > driver.status.pick) {
        return;
      }

      driver.distance = distance;

      drivers.push(driver);
    });

    return drivers;
  } catch (error) {
    console.log(error);

    return [];
  }
};

module.exports = {
  getAvailableDrivers,
};
