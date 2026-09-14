import "dotenv/config";

const GOOGLE_MAPS_APIKEY = process.env.GOOGLE_MAPS_APIKEY

console.log(
  "Google Maps API Key loaded:",
  GOOGLE_MAPS_APIKEY ? "YES" : "NO"
);

export default {
  expo: {
    name: "KandoLipa",
    slug: "kandolipa",
    version: "1.0.0",
    
    android: {
      package: "com.reynold.kandolipa",

      googleServicesFile: "./google-services.json",

      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_APIKEY,
        },
      },
    },

    extra: {
      GOOGLE_MAPS_APIKEY,
    },
  },
};