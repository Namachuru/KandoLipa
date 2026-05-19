import "dotenv/config";

export default {
  expo: {
    name: "KandoLipa",
    slug: "kandolipa",
    extra: {
      GOOGLE_MAPS_APIKEY: process.env.GOOGLE_MAPS_APIKEY,
    },
  },
};