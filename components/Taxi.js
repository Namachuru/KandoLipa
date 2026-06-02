import 'react-native-get-random-values';
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
import { generateRideOptions } from "./services/rideMatchingEngine";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { getAvailableDrivers } from "./services/driverService";

const Taxi = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideFor, setRideFor] = useState("me");
  const [region, setRegion] = useState({
   countryCode: null,
   city: null,
  });
  const [rideOptions, setRideOptions] = useState({});
  const [drivers, setDrivers] = useState([]);

  const mapRef = useRef(null);
  
  const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;
  
  const [selectedRide, setSelectedRide] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [mchoroFrame, setMchoroFrame] = useState(1);
  const [rokaFrame, setRokaFrame] = useState(1);
  const [weaFrame, setWeaFrame] = useState(1);
  const [zoaFrame, setZoaFrame] = useState(1);

  const handleRidePress = (type) => {

    setSelectedRide(type);

    if (type === "Mchoro") {

      setMchoroFrame(2);

        setTimeout(() => {
          setMchoroFrame(3);
        }, 120);

        setTimeout(() => {
          setMchoroFrame(4);
        }, 240);

        const wheelLoop = setInterval(() => {

          setMchoroFrame(prev => (
            prev === 3 ? 4 : 3
          ));

        }, 120);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 1800,
          useNativeDriver: true,
        }).start(() => {

        clearInterval(wheelLoop);

        navigation.navigate("FetchingDriver", {
          userLocation,
          destination,
          selectedRide: type,
          rideData: rideOptions[type],
          baseFare: rideOptions[type]?.fare,
        });
      });
    }
    else if (type === "Roka") {

      setRokaFrame(2);

        setTimeout(() => {
          setRokaFrame(3);
        }, 120);

        setTimeout(() => {
          setRokaFrame(4);
        }, 240);

        setTimeout(() => {
          setRokaFrame(4);
        }, 240);

        const wheelLoop = setInterval(() => {

          setRokaFrame(prev => (
            prev === 4 ? 5 : 4
          ));

        }, 120);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 1800,
          useNativeDriver: true,
        }).start(() => {

        clearInterval(wheelLoop);

        navigation.navigate("FetchingDriver", {
          userLocation,
          destination,
          selectedRide: type,
          rideData: rideOptions[type],
          baseFare: rideOptions[type]?.fare,
        });
      });
    }
    if (type === "Wea") {

      setWeaFrame(2);

        setTimeout(() => {
          setWeaFrame(3);
        }, 120);

        setTimeout(() => {
          setWeaFrame(4);
        }, 240);

        const wheelLoop = setInterval(() => {

          setWeaFrame(prev => (
            prev === 3 ? 4 : 3
          ));

        }, 120);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 1800,
          useNativeDriver: true,
        }).start(() => {

        clearInterval(wheelLoop);

        navigation.navigate("FetchingDriver", {
          userLocation,
          destination,
          selectedRide: type,
          rideData: rideOptions[type],
          baseFare: rideOptions[type]?.fare,
        });
      });
    }
    if (type === "Zoa") {

      setZoaFrame(2);

        setTimeout(() => {
          setZoaFrame(3);
        }, 120);

        setTimeout(() => {
          setZoaFrame(4);
        }, 240);

        const wheelLoop = setInterval(() => {

          setZoaFrame(prev => (
            prev === 3 ? 4 : 3
          ));

        }, 120);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 1800,
          useNativeDriver: true,
        }).start(() => {

        clearInterval(wheelLoop);

        navigation.navigate("FetchingDriver", {
          userLocation,
          destination,
          selectedRide: type,
          rideData: rideOptions[type],
          baseFare: rideOptions[type]?.fare,
        });
      });
    }
  };
  
  // Fetch user location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      const geocode = await Location.reverseGeocodeAsync(location.coords);

      if (geocode.length > 0) {
        setRegion({
          countryCode:
            geocode[0].isoCountryCode?.toLowerCase(),
          
          city:
            geocode[0].city ||
            geocode[0].subregion ||
            null,
        });
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (userLocation && destination && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [userLocation, destination],
        {
          edgePadding: {
            top: 120,
            right: 50,
            bottom: 250,
            left: 50,
          },
          animated: true,
        }
      );
    }
  }, [destination, userLocation]);

  useEffect(() => {

   console.log("region:", region);
   console.log("destination:", destination);
   console.log("userLocation:", userLocation);

   const loadRides = async () => {
    if (!userLocation || !destination || drivers.length === 0) return;

      console.log("DRIVERS STATE:", drivers);
      
      const result = await generateRideOptions({
        drivers,
        userLocation,
        destination
      });

      console.log("FINAL RIDE OPTIONS:", JSON.stringify(result, null, 2));
      
      console.log("GENERATE RESULT:", result);
      setRideOptions(result);

      console.log("RIDE OPTIONS:", result);
   };

   loadRides();

  }, [userLocation, destination, region?.countryCode, drivers]);

  useEffect(() => {

    const loadDrivers = async () => {
      console.log("DRIVERS STATE:", drivers);
      if (!userLocation) return;

      const data = await getAvailableDrivers({
        userLocation
      });

      console.log("AVAILABLE DRIVERS:", data);

      setDrivers(data);
    };

    loadDrivers();

  }, [userLocation]);

  const isLoading = !userLocation || !region.countryCode;
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading location...</Text>
      </View>
    );
  }
  console.log("RIDE OPTIONS KEYS:", Object.keys(rideOptions));
  console.log("RIDE OPTIONS STATE:", rideOptions);
  return (
    <View style={styles.container}>
      {/* ✅ Map */}
      {userLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={userLocation}
            title="You are here"
          />

          {/* DESTINATION MARKER */}
          {destination && <Marker coordinate={destination} />}

          {/* ROUTE LINE */}
          {userLocation && destination && (
            <MapViewDirections
              origin={userLocation}
              destination={destination}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={5}
              strokeColor="black"
            />
          )}
        </MapView>
      )}

      {/* AUTOCOMPLETE SEARCH */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Where to?"
          fetchDetails={true}
          minLength={2}
          debounce={300}
          enablePoweredByContainer={false}
          keyboardShouldPersistTaps="handled"

          onPress={(data, details = null) => {
            console.log("PLACE SELECTED", data);
            if (!details) {
              console.log("NO DETAILS");
              return;
            }
            const location = details.geometry.location;

            setDestination({
              latitude: location.lat,
              longitude: location.lng,
            });

            console.log("DESTINATION SET");
          }}

          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: "en",
            components: region.countryCode ? `country:${region.countryCode}` : undefined,
          }}

          styles={{
            textInputContainer: {
              width: "100%",
            },
            textInput: {
              borderRadius: 10,
              paddingHorizontal: 15,
              fontSize: 16,
              height: 50,
              color: "black",
            },

            listView: {
              backgroundColor: "white",
              borderRadius: 10,
              marginTop: 5,
              zIndex: 999999,
              elevation: 999999
            },
          }}
        />
      </View>

      {/* ✅ Controls */}
      <View style={styles.topOverlay}>
        {/* Ride Selection Bar */}
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "me" && styles.activeOption,
            ]}
            onPress={() => setRideFor("me")}
          >
            <Text>For Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "other" && styles.activeOption,
            ]}
            onPress={() => setRideFor("other")}
          >
            <Text>For Someone Else</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Back Home Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text>⬅ Back Home</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardsContainer}>
      
        {/* MCHORO CARD */}
{rideOptions?.Mchoro && (
  <TouchableOpacity
    activeOpacity={0.4}
    style={styles.vehicleCard}
    onPress={() => handleRidePress("Mchoro")}
  >

    <View style={styles.cardRow}>

      {/* VEHICLE IMAGE */}
      <Animated.Image
        source={
          mchoroFrame === 1
            ? require("../assets/weari/mchoro.png")
            : mchoroFrame === 2
            ? require("../assets/weari/mchoro2.png")
            : mchoroFrame === 3
            ? require("../assets/weari/mchoro3.png")
            : require("../assets/weari/mchoro4.png")
        }
        style={[
          styles.sideVehicleImage,
          selectedRide === "Mchoro"
            ? {
                transform: [{ translateX: slideAnim }],
              }
            : null,
        ]}
        resizeMode="contain"
      />

      {/* INFO */}
      <Animated.View
        style={[
          styles.cardInfoContainer,
          selectedRide === "Mchoro"
            ? {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 500],
                      outputRange: [0, -250],
                    }),
                  },
                ],
                opacity: slideAnim.interpolate({
                  inputRange: [0, 250],
                  outputRange: [1, 0],
                }),
              }
            : null,
        ]}
      >
        <View>
        <Text style={styles.vehicleName}>
          Mchoro
        </Text>

        <Text style={styles.vehicleEta}>
          ETA: {rideOptions?.Mchoro?.pickupEta ?? 0} min
        </Text>
        </View>
        <Text style={styles.vehicleFare}>
          TSh {rideOptions?.Mchoro?.fare ?? 0}
        </Text>

      </Animated.View>

    </View>

  </TouchableOpacity>
)}
    {/* ROKA CARD */}
{rideOptions?.Roka && (
  <TouchableOpacity
    activeOpacity={0.4}
    style={styles.vehicleCard}
    onPress={() => handleRidePress("Roka")}
  >

    <View style={styles.cardRow}>

      {/* VEHICLE IMAGE */}
      <Animated.Image
        source={
          rokaFrame === 1
            ? require("../assets/weari/roka.png")
            : rokaFrame === 2
            ? require("../assets/weari/roka2.png")
            : rokaFrame === 3
            ? require("../assets/weari/roka3.png")
            : rokaFrame === 4
            ? require("../assets/weari/roka4.png")
            : rokaFrame === 5
            ? require("../assets/weari/roka5.png")
            : require("../assets/weari/roka6.png")
        }
        style={[
          styles.sideVehicleImage,
          selectedRide === "Roka"
            ? {
                transform: [{ translateX: slideAnim }],
              }
            : null,
        ]}
        resizeMode="contain"
      />

      {/* INFO */}
      <Animated.View
        style={[
          styles.cardInfoContainer,
          selectedRide === "Roka"
            ? {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 500],
                      outputRange: [0, -250],
                    }),
                  },
                ],
                opacity: slideAnim.interpolate({
                  inputRange: [0, 250],
                  outputRange: [1, 0],
                }),
              }
            : null,
        ]}
      >
        <View>
        <Text style={styles.vehicleName}>
          Roka
        </Text>

        <Text style={styles.vehicleEta}>
          ETA: {rideOptions?.Roka?.pickupEta ?? 0} min
        </Text>
        </View>
        <Text style={styles.vehicleFare}>
          TSh {rideOptions?.Roka?.fare ?? 0}
        </Text>

      </Animated.View>

    </View>

  </TouchableOpacity>
)}
    {/* WEA CARD */}
{rideOptions?.Wea && (
  <TouchableOpacity
    activeOpacity={0.4}
    style={styles.vehicleCard}
    onPress={() => handleRidePress("Wea")}
  >

    <View style={styles.cardRow}>

      {/* VEHICLE IMAGE */}
      <Animated.Image
        source={
          weaFrame === 1
            ? require("../assets/weari/wea.png")
            : require("../assets/weari/wea2.png")
        }
        style={[
          styles.sideVehicleImage,
          selectedRide === "Wea"
            ? {
                transform: [{ translateX: slideAnim }],
              }
            : null,
        ]}
        resizeMode="contain"
      />

      {/* INFO */}
      <Animated.View
        style={[
          styles.cardInfoContainer,
          selectedRide === "Wea"
            ? {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 500],
                      outputRange: [0, -250],
                    }),
                  },
                ],
                opacity: slideAnim.interpolate({
                  inputRange: [0, 250],
                  outputRange: [1, 0],
                }),
              }
            : null,
        ]}
      >
        <View>
        <Text style={styles.vehicleName}>
          Wea
        </Text>

        <Text style={styles.vehicleEta}>
          ETA: {rideOptions?.Wea?.pickupEta ?? 0} min
        </Text>
        </View>
        <Text style={styles.vehicleFare}>
          TSh {rideOptions?.Wea?.fare ?? 0}
        </Text>

      </Animated.View>

    </View>

  </TouchableOpacity>
)}
      {/* ZOA CARD */}
{rideOptions?.Zoa && (
  <TouchableOpacity
    activeOpacity={0.4}
    style={styles.vehicleCard}
    onPress={() => handleRidePress("Zoa")}
  >

    <View style={styles.cardRow}>

      {/* VEHICLE IMAGE */}
      <Animated.Image
        source={
          zoaFrame === 1
            ? require("../assets/weari/zoa.png")
            : require("../assets/weari/zoa2.png")
        }
        style={[
          styles.sideVehicleImage,
          selectedRide === "Zoa"
            ? {
                transform: [{ translateX: slideAnim }],
              }
            : null,
        ]}
        resizeMode="contain"
      />

      {/* INFO */}
      <Animated.View
        style={[
          styles.cardInfoContainer,
          selectedRide === "Zoa"
            ? {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 500],
                      outputRange: [0, -250],
                    }),
                  },
                ],
                opacity: slideAnim.interpolate({
                  inputRange: [0, 250],
                  outputRange: [1, 0],
                }),
              }
            : null,
        ]}
      >
        <View>
        <Text style={styles.vehicleName}>
          Zoa
        </Text>
        
        <Text style={styles.vehicleEta}>
          ETA: {rideOptions?.Zoa?.pickupEta ?? 0} min
        </Text>
        </View>

        <Text style={styles.vehicleFare}>
          TSh {rideOptions?.Zoa?.fare ?? 0}
        </Text>
      </Animated.View>

    </View>

  </TouchableOpacity>
)}

    </View>
    </View>
  );
};

export default Taxi;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: "100%",
    height: "100%",
    zIndex: 0,
  },

  searchContainer: {
    position: "absolute",
    top: 35,
    width: "92%",
    alignSelf: "center",
    zIndex: 99999,
    elevation: 99999,
  },
  
  /* Floating Overlay */
  topOverlay: {
    position: "absolute",
    top: 95,
    width: "100%",
    paddingHorizontal: 5,
    backgroundColor: "transparent",
    zIndex: 1,
    pointerEvents: "box-none"
  },

  /* Selection Bar */
  selectionBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 0,
  },

  optionButton: {
    backgroundColor: "rgba(255,255,255,0.7)",
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },

  activeOption: {
    backgroundColor: "rgba(165, 231, 90,0.5)",
  },

  optionText: {
    fontWeight: "600",
    color: "black",
  },

  /* Search Bar */
  searchBar: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    elevation: 0,
    marginBottom: 60,
  },

  /* Back Home Button */
  backButton: {
    backgroundColor: "rgba(255, 232, 94, 0.5)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    elevation: 0,
  },

  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },

  rideCard: {
   position: "absolute",
   bottom: 10,
   width: "92%",
   alignSelf: "center",
   borderRadius: 5,
   padding: 5,
   elevation: 0,
  },

  cardTitle: {
   fontSize: 20,
   fontWeight: "bold",
   marginBottom: 10,
  },

  cardsContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingHorizontal: 5,
    zIndex: 999,
    pointerEvents: "box-none"
  },

  vehicleCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 5,
    marginBottom: 6,
    elevation: 0,
  },

  vehicleImage: {
    width: 140,
    height: 70,
    alignSelf: "center",
  },

  cardRow: {
  flexDirection: "row",
  alignItems: "center",
},

sideVehicleImage: {
  width: 90,
  height: 70,
  marginRight: 10,
},

cardInfoContainer: {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

vehicleName: {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 2,
},

vehicleEta: {
  fontSize: 15,
  opacity: 0.7,
},

vehicleFare: {
  fontSize: 18,
  fontWeight: "bold",
},
});


