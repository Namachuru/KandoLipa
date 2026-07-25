import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Adjust if needed

const Home = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);

      Alert.alert(
        "Signed Out",
        "You have been successfully signed out."
      );

      navigation.replace("Login");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to KandoLipa</Text>

      <Button
        title="Shop"
        color="rgb(165,231,90)"
        onPress={() => navigation.navigate("Shop")}
      />

      <Button
        title="Real Estate"
        color="rgb(165,231,90)"
        onPress={() => navigation.navigate("Real Estate")}
      />

      <Button
        title="Taxi"
        color="rgb(165,231,90)"
        onPress={() => navigation.navigate("Taxi")}
      />

      <Button
        title="Logout"
        color="red"
        onPress={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgb(255, 232, 94)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
});

export default Home;
