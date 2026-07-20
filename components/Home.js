import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = ({ navigation }) => {
  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Storage has been reset!');
      // Navigate to FirstTimeRegistration after reset
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset storage.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to KandoLipa</Text>
      
      <Button color="rgb(165,231,90)"
        title="Shop"
        onPress={() => navigation.navigate('Shop')}
      />
      
      <Button color="rgb(165,231,90)"
        title="Real Estate"
        onPress={() => navigation.navigate('Real Estate')}
      />
      
      <Button color="rgb(165,231,90)"
        title="Taxi"
        onPress={() => navigation.navigate('Taxi')}
      />

      {/* Test button to reset AsyncStorage */}
      <Button
        title="Reset Storage"
        onPress={handleReset}
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgb(255, 232, 94)' // Using the first color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black' // Using the second color for text
  },
});

export default Home;
