import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { getFaidaDb } from "../firebase/firebase";

const ArrivedScreen = ({ route, navigation }) => {
  const {
    driver,
    rideData,
    finalFare,
    actualDistanceKm,
    actualMinutes,
    requestId,
    clientId,
  } = route.params || {};

  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async () => {
    if (rating < 1 || submitting) {
      return;
    }

    if (!driver?.mp_id) {
      Alert.alert(
        "Rating Error",
        "Driver ID was not found. The rating could not be submitted."
      );
      return;
    }

    try {
      setSubmitting(true);

      console.log("=================================");
      console.log("⭐ SUBMITTING DRIVER RATING");
      console.log("MP ID:", driver.mp_id);
      console.log("GIVEN RATING:", rating);
      console.log("=================================");

      // Get the KandoFaida database.
      const db = await getFaidaDb();

      console.log("🔥 FAIDA DATABASE READY:", !!db);

      if (!db) {
        throw new Error(
          "KandoFaida database could not be initialized."
        );
      }

      const statsPath =
        `KandoFaida/mobility_partners/${driver.mp_id}/stats`;

      console.log("📍 RATING STATS PATH:", statsPath);

      // Use the React Native Firebase database instance API.
      const statsRef = db.ref(statsPath);

      console.log("📡 STARTING RATING TRANSACTION...");

      await statsRef.transaction((currentStats) => {
        console.log("📥 CURRENT STATS:", currentStats);

        const currentNumRatings = Number(
          currentStats?.numRatings || 0
        );

        const currentAverage = Number(
          currentStats?.rating || 0
        );

        /*
         * Your requested calculation:
         *
         * (currentAverage + givenRating)
         * --------------------------------
         * (currentNumRatings + 1)
         */

        const newNumRatings =
          currentNumRatings + 1;

        const newAverage =
          (currentAverage + rating) /
          newNumRatings;

        console.log(
          "📊 CURRENT NUM RATINGS:",
          currentNumRatings
        );

        console.log(
          "⭐ CURRENT AVERAGE:",
          currentAverage
        );

        console.log(
          "⭐ GIVEN RATING:",
          rating
        );

        console.log(
          "📊 NEW NUM RATINGS:",
          newNumRatings
        );

        console.log(
          "⭐ NEW AVERAGE:",
          newAverage
        );

        return {
          ...(currentStats || {}),
          numRatings: newNumRatings,
          rating: Number(
            newAverage.toFixed(2)
          ),
        };
      });

      console.log("=================================");
      console.log(
        "✅ DRIVER RATING UPDATED SUCCESSFULLY"
      );
      console.log("MP ID:", driver.mp_id);
      console.log("=================================");

      // Only return Home after Firebase confirms success.
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Home",
          },
        ],
      });

    } catch (error) {
      console.log("=================================");
      console.log("❌ RATING SUBMISSION ERROR");
      console.log("ERROR:", error);
      console.log(
        "ERROR MESSAGE:",
        error?.message
      );
      console.log(
        "ERROR STACK:",
        error?.stack
      );
      console.log("=================================");

      setSubmitting(false);

      Alert.alert(
        "Rating Failed",
        error?.message ||
          "Your rating could not be submitted. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.header}>
        Trip Completed
      </Text>

      <Text style={styles.driver}>
        Driver:{" "}
        {driver?.full_name || "Driver"}
      </Text>

      <View style={styles.card}>

        <Text style={styles.label}>
          Vehicle
        </Text>

        <Text style={styles.value}>
          {rideData?.type ||
            rideData?.selectedRide ||
            "N/A"}
        </Text>

        <Text style={styles.label}>
          Distance Travelled
        </Text>

        <Text style={styles.value}>
          {Number(
            actualDistanceKm || 0
          ).toFixed(2)}{" "}
          km
        </Text>

        <Text style={styles.label}>
          Duration
        </Text>

        <Text style={styles.value}>
          {Number(
            actualMinutes || 0
          ).toFixed(1)}{" "}
          min
        </Text>

        <Text style={styles.fareTitle}>
          Total Fare
        </Text>

        <Text style={styles.fare}>
          TSh{" "}
          {Number(
            finalFare || 0
          ).toLocaleString()}
        </Text>

      </View>

      <Text style={styles.rateText}>
        Rate your driver
      </Text>

      <View style={styles.starRow}>

        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.star,
                {
                  opacity:
                    rating >= star
                      ? 1
                      : 0.3,
                },
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}

      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            opacity:
              rating < 1 || submitting
                ? 0.5
                : 1,
          },
        ]}
        onPress={submitRating}
        disabled={
          rating < 1 || submitting
        }
      >
        <Text style={styles.buttonText}>
          {submitting
            ? "Submitting..."
            : "Submit Rating"}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default ArrivedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  driver: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 15,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
  },

  fareTitle: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 18,
  },

  fare: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "bold",
    color: "green",
  },

  rateText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 18,
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },

  star: {
    fontSize: 45,
    marginHorizontal: 8,
  },

  button: {
    backgroundColor: "#22c55e",
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});

