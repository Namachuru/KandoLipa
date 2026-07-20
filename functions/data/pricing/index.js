const {rideRates} = require("./TZ");

const pricingRegistry = {
  TZ: rideRates,
};

module.exports = {
  pricingRegistry,
};
