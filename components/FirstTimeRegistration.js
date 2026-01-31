import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const FirstTimeRegistration = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Storage has been reset!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset storage.');
    }
  };
  
  useEffect(() => {
    const checkFirstTime = async () => {
      const isFirstTime = await AsyncStorage.getItem('isFirstTime');
      if (isFirstTime === null || isFirstTime === 'true') {
        // First time login
        fetchLocation();
      } else {
        // Not the first time, navigate to Home
        navigation.navigate('Home');
      }
    };

    const fetchLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                return;
            }

            const position = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
        } catch (error) {
            Alert.alert('Error', 'Unable to fetch location.');
        }
    };


    checkFirstTime();
  }, []);

  const handleRegister = async () => {
    if (!firstName || !lastName || !phoneNumber || !location.latitude || !location.longitude) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const userData = {
      firstName,
      middleName,
      lastName,
      phoneNumber,
      email,
      dateOfBirth,
      location,
      createdAt: new Date().toISOString(),
    };

    // Save user data and mark as not first time
    await AsyncStorage.setItem('isFirstTime', 'false');
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

    // Navigate to Home after registration
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First Name *</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter your first name"
      />

      <Text style={styles.label}>Middle Name</Text>
      <TextInput
        style={styles.input}
        value={middleName}
        onChangeText={setMiddleName}
        placeholder="Enter your middle name"
      />

      <Text style={styles.label}>Last Name *</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter your last name"
      />

      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email (Optional)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Date of Birth (Optional)</Text>
      <TextInput
        style={styles.input}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="YYYY-MM-DD"
      />

      <Button color="rgb(165,231,90)" title="Register" onPress={handleRegister} />

      <Text style={styles.note}>* Required fields</Text>
      
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
    padding: 20,
    backgroundColor: 'rgb(255, 232, 94)', // Using the first color as the background
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'flex-start',
    color: 'black', // Using the second color for the text
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-start',
  },
});

export default FirstTimeRegistration;