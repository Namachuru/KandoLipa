import "dotenv/config";

export default {
  expo: {
    name: "KandoLipa",
    slug: "kandolipa",
    
    android: {
      package: "com.reynold.kandolipa",
      googleServicesFile: "./google-services.json",
    },
    
    extra: {
      GOOGLE_MAPS_APIKEY: process.env.GOOGLE_MAPS_APIKEY,
    },
  },
};