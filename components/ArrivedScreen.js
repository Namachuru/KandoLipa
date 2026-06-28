import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ref, set } from "firebase/database";
import { faidaDb } from "../firebase/firebase";

const ArrivedScreen = ({ route, navigation }) => {
  const {
    driver,
    rideData,
    finalFare,
    actualDistanceKm,
    actualMinutes,
  } = route.params;

  const [rating, setRating] = useState(0);

  const submitRating = async () => {
    if (rating < 1) return;

    try {
      await set(
        ref(
          faidaDb,
          `KandoFaida/mobility_partners/${driver.mp_id}/ratings/${Date.now()}`
        ),
        rating
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Trip Completed
      </Text>

      <Text style={styles.driver}>
        Driver: {driver.full_name}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Vehicle
        </Text>

        <Text style={styles.value}>
          {rideData.type}
        </Text>

        <Text style={styles.label}>
          Distance Travelled
        </Text>

        <Text style={styles.value}>
          {actualDistanceKm.toFixed(2)} km
        </Text>

        <Text style={styles.label}>
          Duration
        </Text>

        <Text style={styles.value}>
          {actualMinutes.toFixed(1)} min
        </Text>

        <Text style={styles.fareTitle}>
          Total Fare
        </Text>

        <Text style={styles.fare}>
          TSh {finalFare.toLocaleString()}
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
          >
            <Text
              style={[
                styles.star,
                {
                  opacity:
                    rating >= star ? 1 : 0.3,
                },
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={submitRating}
      >
        <Text style={styles.buttonText}>
          Submit Rating
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