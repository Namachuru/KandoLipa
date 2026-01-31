import { View, Text, Button, StyleSheet } from 'react-native';

const RealEstate = ({ navigation }) => {
  const handleBack = async () => {
    navigation.navigate('Home');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comming Soon</Text>

      {/* Back button */}
      <Button
        title="Back Home"
        onPress={handleBack}
        color="rgb(165, 231, 90)"
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
    backgroundColor: 'rgb(255, 232, 94)', // Using the first color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black', // Using the second color for text
  },
  button: {
    backgroundColor: 'rgb(165, 231, 90)',
    color: 'black',
    marginTop: 10,
  },
});

export default RealEstate;
