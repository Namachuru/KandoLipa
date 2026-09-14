import 'react-native-get-random-values';
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { lipaFunctions } from "../firebase/firebase";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

const Taxi = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideFor, setRideFor] = useState("me");
  const [region, setRegion] = useState({
    countryCode: null,
    city: null,
  });
  const [rideOptions, setRideOptions] = useState({});
  const [selectedRide, setSelectedRide] = useState(null);

  const matchDriver = lipaFunctions.httpsCallable("matchDriver");

  const mapRef = useRef(null);

  const GOOGLE_MAPS_APIKEY =
    Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;

  /*
   * ---------------------------------------------------------
   * ANIMATION STATE
   * ---------------------------------------------------------
   *
   * Mchoro:
   * 1 -> 2 -> 1
   * This represents trying to start the engine.
   *
   * Then:
   * 3 <-> 4
   * These are the moving-wheel frames.
   *
   * Roka:
   * 1 -> 2 -> 3 -> 4
   * This represents starting the engine.
   *
   * Then:
   * 5 <-> 6
   * These are the moving-wheel frames.
   *
   * Wea / Zoa:
   * 1 <-> 2
   * They animate while waiting for the Roka start
   * sequence to finish.
   */

  const [mchoroFrame, setMchoroFrame] = useState(1);
  const [rokaFrame, setRokaFrame] = useState(1);
  const [weaFrame, setWeaFrame] = useState(1);
  const [zoaFrame, setZoaFrame] = useState(1);

  /*
   * Roka starting sequence duration.
   *
   * 1 -> 2 -> 3 -> 4
   *
   * Each frame lasts 300ms.
   * Total startup time = 1200ms.
   */
  const ROKA_START_TIME = 1200;

  /*
   * Vehicle movement duration after startup.
   */
  const VEHICLE_EXIT_DURATION = 1800;

  /*
   * Animation refs.
   * These allow us to clean up timers when the component
   * unmounts or when another ride is selected.
   */
  const animationTimers = useRef([]);
  const animationIntervals = useRef([]);

  const clearAnimations = () => {
    animationTimers.current.forEach((timer) => {
      clearTimeout(timer);
    });

    animationIntervals.current.forEach((interval) => {
      clearInterval(interval);
    });

    animationTimers.current = [];
    animationIntervals.current = [];
  };

  /*
   * ---------------------------------------------------------
   * NAVIGATE TO FETCHING DRIVER
   * ---------------------------------------------------------
   */
  const goToFetchingDriver = (type) => {
    navigation.navigate("FetchingDriver", {
      userLocation,
      destination,
      selectedRide: type,
      rideData: rideOptions[type],
      baseFare: rideOptions[type]?.fare,
    });
  };

  /*
   * ---------------------------------------------------------
   * HANDLE RIDE PRESS
   * ---------------------------------------------------------
   */
  const handleRidePress = (type) => {
    clearAnimations();

    setSelectedRide(type);

    /*
     * Reset every vehicle to its first frame.
     */
    setMchoroFrame(1);
    setRokaFrame(1);
    setWeaFrame(1);
    setZoaFrame(1);

    /*
     * Reset slide position.
     */
    slideAnim.setValue(0);

    /*
     * -------------------------------------------------------
     * MCHORO
     * -------------------------------------------------------
     *
     * Start:
     * mchoro -> mchoro2 -> mchoro
     *
     * Then wait until the Roka startup duration is finished.
     *
     * After that:
     * mchoro3 <-> mchoro4
     *
     * while the vehicle moves off screen.
     */
    if (type === "Mchoro") {
      setMchoroFrame(1);

      const timer1 = setTimeout(() => {
        setMchoroFrame(2);
      }, 300);

      const timer2 = setTimeout(() => {
        setMchoroFrame(1);
      }, 600);

      const timer3 = setTimeout(() => {
        setMchoroFrame(3);

        const wheelLoop = setInterval(() => {
          setMchoroFrame((prev) => (prev === 3 ? 4 : 3));
        }, 150);

        animationIntervals.current.push(wheelLoop);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: VEHICLE_EXIT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          clearInterval(wheelLoop);
          goToFetchingDriver(type);
        });
      }, ROKA_START_TIME);

      animationTimers.current.push(timer1, timer2, timer3);
    }

    /*
     * -------------------------------------------------------
     * ROKA
     * -------------------------------------------------------
     *
     * Start:
     * roka -> roka2 -> roka3 -> roka4
     *
     * Roka does NOT move during these frames.
     *
     * After roka4:
     * roka5 <-> roka6
     *
     * Then it moves off screen.
     */
    else if (type === "Roka") {
      setRokaFrame(1);

      const timer1 = setTimeout(() => {
        setRokaFrame(2);
      }, 300);

      const timer2 = setTimeout(() => {
        setRokaFrame(3);
      }, 600);

      const timer3 = setTimeout(() => {
        setRokaFrame(4);
      }, 900);

      const timer4 = setTimeout(() => {
        setRokaFrame(5);

        const wheelLoop = setInterval(() => {
          setRokaFrame((prev) => (prev === 5 ? 6 : 5));
        }, 150);

        animationIntervals.current.push(wheelLoop);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: VEHICLE_EXIT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          clearInterval(wheelLoop);
          goToFetchingDriver(type);
        });
      }, ROKA_START_TIME);

      animationTimers.current.push(
        timer1,
        timer2,
        timer3,
        timer4
      );
    }

    /*
     * -------------------------------------------------------
     * WEA
     * -------------------------------------------------------
     *
     * Wea does not have a starting-engine animation.
     *
     * It remains in:
     * wea <-> wea2
     *
     * for the same amount of time it takes Roka to start.
     *
     * After that it moves off screen.
     */
    else if (type === "Wea") {
      setWeaFrame(1);

      const wheelLoop = setInterval(() => {
        setWeaFrame((prev) => (prev === 1 ? 2 : 1));
      }, 150);

      animationIntervals.current.push(wheelLoop);

      const timer = setTimeout(() => {
        clearInterval(wheelLoop);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: VEHICLE_EXIT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          goToFetchingDriver(type);
        });
      }, ROKA_START_TIME);

      animationTimers.current.push(timer);
    }

    /*
     * -------------------------------------------------------
     * ZOA
     * -------------------------------------------------------
     *
     * Same behaviour as Wea:
     *
     * zoa <-> zoa2
     *
     * while waiting for the Roka startup duration.
     *
     * Then move off screen.
     */
    else if (type === "Zoa") {
      setZoaFrame(1);

      const wheelLoop = setInterval(() => {
        setZoaFrame((prev) => (prev === 1 ? 2 : 1));
      }, 150);

      animationIntervals.current.push(wheelLoop);

      const timer = setTimeout(() => {
        clearInterval(wheelLoop);

        Animated.timing(slideAnim, {
          toValue: 500,
          duration: VEHICLE_EXIT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          goToFetchingDriver(type);
        });
      }, ROKA_START_TIME);

      animationTimers.current.push(timer);
    }
  };

  /*
   * ---------------------------------------------------------
   * SLIDE ANIMATION
   * ---------------------------------------------------------
   */
  const slideAnim = useRef(new Animated.Value(0)).current;

  /*
   * Cleanup animations when Taxi screen is removed.
   */
  useEffect(() => {
    return () => {
      clearAnimations();
      slideAnim.stopAnimation();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * GET USER LOCATION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const getLocation = async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permission denied");
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

      setUserLocation(location.coords);

      const geocode =
        await Location.reverseGeocodeAsync(location.coords);

      console.log("GEOCODE:", geocode);

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

  /*
   * ---------------------------------------------------------
   * FIT MAP TO USER + DESTINATION
   * ---------------------------------------------------------
   */
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

  /*
   * ---------------------------------------------------------
   * LOAD RIDE OPTIONS
   * ---------------------------------------------------------
   */
  useEffect(() => {
    console.log("region:", region);
    console.log("destination:", destination);
    console.log("userLocation:", userLocation);

    const loadRides = async () => {
      if (!userLocation || !destination) return;

      try {
        const result = await matchDriver({
          userLocation: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        });

        console.log("Ride options:", result.data);

        setRideOptions(result.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadRides();
  }, [userLocation, destination]);

  const isLoading =
    !userLocation || !region.countryCode;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading location...</Text>
      </View>
    );
  }

  console.log(
    "RIDE OPTIONS KEYS:",
    Object.keys(rideOptions)
  );

  console.log(
    "RIDE OPTIONS STATE:",
    rideOptions
  );

  return (
    <View style={styles.container}>

      {/* MAP */}
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

          {destination && (
            <Marker coordinate={destination} />
          )}

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
            components: region.countryCode
              ? `country:${region.countryCode}`
              : undefined,
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
              elevation: 999999,
            },
          }}
        />
      </View>

      {/* TOP CONTROLS */}
      <View style={styles.topOverlay}>

        {/* RIDE FOR */}
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "me" &&
                styles.activeOption,
            ]}
            onPress={() => setRideFor("me")}
          >
            <Text>For Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "other" &&
                styles.activeOption,
            ]}
            onPress={() => setRideFor("other")}
          >
            <Text>For Someone Else</Text>
          </TouchableOpacity>
        </View>

        {/* BACK HOME */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text>⬅ Back Home</Text>
        </TouchableOpacity>
      </View>

      {/* RIDE CARDS */}
      <View style={styles.cardsContainer}>

        {/* =================================================
            MCHORO
        ================================================= */}
        {rideOptions?.Mchoro && (
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.vehicleCard}
            onPress={() =>
              handleRidePress("Mchoro")
            }
          >
            <View style={styles.cardRow}>

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
                  selectedRide === "Mchoro" && {
                    transform: [
                      { translateX: slideAnim },
                    ],
                  },
                ]}
                resizeMode="contain"
              />

              <Animated.View
                style={[
                  styles.cardInfoContainer,
                  selectedRide === "Mchoro" && {
                    transform: [
                      {
                        translateX:
                          slideAnim.interpolate({
                            inputRange: [0, 500],
                            outputRange: [0, -250],
                          }),
                      },
                    ],

                    opacity:
                      slideAnim.interpolate({
                        inputRange: [0, 250],
                        outputRange: [1, 0],
                      }),
                  },
                ]}
              >
                <View>
                  <Text style={styles.vehicleName}>
                    Mchoro
                  </Text>

                  <Text style={styles.vehicleEta}>
                    ETA:{" "}
                    {rideOptions?.Mchoro?.pickupEta ??
                      0}{" "}
                    min
                  </Text>
                </View>

                <Text style={styles.vehicleFare}>
                  TSh{" "}
                  {rideOptions?.Mchoro?.fare ?? 0}
                </Text>
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        {/* =================================================
            ROKA
        ================================================= */}
        {rideOptions?.Roka && (
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.vehicleCard}
            onPress={() =>
              handleRidePress("Roka")
            }
          >
            <View style={styles.cardRow}>

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
                  selectedRide === "Roka" && {
                    transform: [
                      { translateX: slideAnim },
                    ],
                  },
                ]}
                resizeMode="contain"
              />

              <Animated.View
                style={[
                  styles.cardInfoContainer,
                  selectedRide === "Roka" && {
                    transform: [
                      {
                        translateX:
                          slideAnim.interpolate({
                            inputRange: [0, 500],
                            outputRange: [0, -250],
                          }),
                      },
                    ],

                    opacity:
                      slideAnim.interpolate({
                        inputRange: [0, 250],
                        outputRange: [1, 0],
                      }),
                  },
                ]}
              >
                <View>
                  <Text style={styles.vehicleName}>
                    Roka
                  </Text>

                  <Text style={styles.vehicleEta}>
                    ETA:{" "}
                    {rideOptions?.Roka?.pickupEta ??
                      0}{" "}
                    min
                  </Text>
                </View>

                <Text style={styles.vehicleFare}>
                  TSh{" "}
                  {rideOptions?.Roka?.fare ?? 0}
                </Text>
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        {/* =================================================
            WEA
        ================================================= */}
        {rideOptions?.Wea && (
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.vehicleCard}
            onPress={() =>
              handleRidePress("Wea")
            }
          >
            <View style={styles.cardRow}>

              <Animated.Image
                source={
                  weaFrame === 1
                    ? require("../assets/weari/wea.png")
                    : require("../assets/weari/wea2.png")
                }
                style={[
                  styles.sideVehicleImage,
                  selectedRide === "Wea" && {
                    transform: [
                      { translateX: slideAnim },
                    ],
                  },
                ]}
                resizeMode="contain"
              />

              <Animated.View
                style={[
                  styles.cardInfoContainer,
                  selectedRide === "Wea" && {
                    transform: [
                      {
                        translateX:
                          slideAnim.interpolate({
                            inputRange: [0, 500],
                            outputRange: [0, -250],
                          }),
                      },
                    ],

                    opacity:
                      slideAnim.interpolate({
                        inputRange: [0, 250],
                        outputRange: [1, 0],
                      }),
                  },
                ]}
              >
                <View>
                  <Text style={styles.vehicleName}>
                    Wea
                  </Text>

                  <Text style={styles.vehicleEta}>
                    ETA:{" "}
                    {rideOptions?.Wea?.pickupEta ??
                      0}{" "}
                    min
                  </Text>
                </View>

                <Text style={styles.vehicleFare}>
                  TSh{" "}
                  {rideOptions?.Wea?.fare ?? 0}
                </Text>
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        {/* =================================================
            ZOA
        ================================================= */}
        {rideOptions?.Zoa && (
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.vehicleCard}
            onPress={() =>
              handleRidePress("Zoa")
            }
          >
            <View style={styles.cardRow}>

              <Animated.Image
                source={
                  zoaFrame === 1
                    ? require("../assets/weari/zoa.png")
                    : require("../assets/weari/zoa2.png")
                }
                style={[
                  styles.sideVehicleImage,
                  selectedRide === "Zoa" && {
                    transform: [
                      { translateX: slideAnim },
                    ],
                  },
                ]}
                resizeMode="contain"
              />

              <Animated.View
                style={[
                  styles.cardInfoContainer,
                  selectedRide === "Zoa" && {
                    transform: [
                      {
                        translateX:
                          slideAnim.interpolate({
                            inputRange: [0, 500],
                            outputRange: [0, -250],
                          }),
                      },
                    ],

                    opacity:
                      slideAnim.interpolate({
                        inputRange: [0, 250],
                        outputRange: [1, 0],
                      }),
                  },
                ]}
              >
                <View>
                  <Text style={styles.vehicleName}>
                    Zoa
                  </Text>

                  <Text style={styles.vehicleEta}>
                    ETA:{" "}
                    {rideOptions?.Zoa?.pickupEta ??
                      0}{" "}
                    min
                  </Text>
                </View>

                <Text style={styles.vehicleFare}>
                  TSh{" "}
                  {rideOptions?.Zoa?.fare ?? 0}
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

  topOverlay: {
    position: "absolute",
    top: 95,
    width: "100%",
    paddingHorizontal: 5,
    backgroundColor: "transparent",
    zIndex: 1,
    pointerEvents: "box-none",
  },

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

  searchBar: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    elevation: 0,
    marginBottom: 60,
  },

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
    pointerEvents: "box-none",
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