import { View, Text, StyleSheet, Image } from "react-native";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function StepAnimationWithLogo({ navigation }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  const stepImages = [
    require("../assets/steps/step1.png"),
    require("../assets/steps/step2.png"),
    require("../assets/steps/step3.png"),
    require("../assets/steps/step4.png"),
    require("../assets/steps/step5.png"),
    require("../assets/steps/step6.png"),
    require("../assets/steps/step7.png"),
    require("../assets/steps/step8.png"),
  ];

  useEffect(() => {
    let current = 0;

    const animateSteps = () => {
      setStepIndex(current);

      setTimeout(() => {
        current++;
        if (current < stepImages.length) {
          animateSteps();
        } else {
          // After last step, show logo and slogan immediately
          setShowLogo(true);
          setTimeout(() => {
            SplashScreen.hideAsync();
            navigation.navigate("First Login");
          }, 1500);
        }
      }, 300); // display each step for 0.3s
    };

    animateSteps();
  }, []);

  return (
    <View style={styles.container}>
      {!showLogo ? (
        <Image
          source={stepImages[stepIndex]}
          style={styles.stepImage}
          resizeMode="contain"
        />
      ) : (
        <View style={{ alignItems: "center" }}>
          <Image
            source={require("../assets/kandolipa-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>KandoLipa</Text>
          <Text style={styles.subtitle}>Fast, smart, and simple.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  stepImage: {
    width: 220,
    height: 220,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 6,
  },
});
