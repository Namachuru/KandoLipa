const {pricingRegistry} = require("./data/pricing");

const calculateFare = ({
  countryCode,
  type,
  distanceKm,
  durationMin,
}) => {
  console.log("PRICING DEBUG:", {
    countryCode,
    type,
    registry: pricingRegistry,
  });

  const countryRates = pricingRegistry[countryCode];

  console.log("COUNTRY RATES:", countryRates);

  if (!countryRates) return 0;

  const rates = countryRates[type];

  if (!rates) return 0;

  let fare =
      rates.baseFare +
      (distanceKm * rates.perKm) +
      (durationMin * rates.perMinute);

  if (fare < rates.minimumFare) {
    fare = rates.minimumFare;
  }

  return {
    fare: Math.round(fare),

    breakdown: {
      baseFare: rates.baseFare,
      distanceCost: distanceKm * rates.perKm,
      timeCost: durationMin * rates.perMinute,
    },
    tripDistance: distanceKm,
    tripEta: durationMin,
  };
};

module.exports = {
  calculateFare,
};
