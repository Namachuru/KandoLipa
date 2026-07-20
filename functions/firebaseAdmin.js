const admin = require("firebase-admin");

// Default app (KandoLipa)
const lipaApp = admin.initializeApp();

// Second app (KandoFaida)
const faidaApp = admin.initializeApp(
    {
      credential: admin.credential.cert(
          require("./kandofaida-service-account.json"),
      ),
      databaseURL: "https://kandofaida-18662-default-rtdb.firebaseio.com",
    },
    "KandoFaida",
);

module.exports = {
  admin,
  lipaDb: lipaApp.database(),
  faidaDb: faidaApp.database(),
};
