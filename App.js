import { StyleSheet } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashSrc from './components/SplashSrc';
import FirstTimeRegistration from './components/FirstTimeRegistration';
import Home from './components/Home';
import Shop from './components/Shop';
import RealEstate from './components/RealEstate';
import Taxi from './components/Taxi';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashSrc} options={{ headerShown: false}} />
            <Stack.Screen name="First Login" component={FirstTimeRegistration} options={{ headerShown: false}} />
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false}} />
            <Stack.Screen name="Shop" component={Shop} options={{ headerShown: false}} />
            <Stack.Screen name="Real Estate" component={RealEstate} options={{ headerShown: false}} />
            <Stack.Screen name="Taxi" component={Taxi} options={{ headerShown: false}} />
        </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
