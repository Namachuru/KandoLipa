export const getCountryFromCoords = async (
   latitude,
   longitude
) => {

   try {

      const response = await fetch(
         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`
      );

      const data = await response.json();

      const components =
         data.results?.[0]?.address_components || [];

      const country = components.find(c =>
         c.types.includes("country")
      );

      return country?.short_name || "TZ";

   } catch (error) {

      console.log("Reverse geocoding error:", error);

      return "TZ";
   }
};