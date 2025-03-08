import React, { useState } from "react";
import Heading from "../../components/heading/Heading";
import Spinner from "../../components/loading/Spinner";
import useAI from "../../hooks/ai/useAI";
import InputTag from "../../components/input/InputTag";
import { marked } from "marked";
import DOMPurify from "dompurify"; // For sanitizing the HTML output
import axios from "axios";

const CropSenseAI = () => {
  const [prediction, setPrediction] = useState("");
  const { predictCrops, isLoading } = useAI();
  const [locationFetched, setLocationFetched] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [formData, setFormData] = useState({
    soil: "",
    altitude: "",
    temperature: "",
    humidity: "",
    rainfall: "",
  });

  // Function to fetch weather data based on latitude and longitude
  const fetchWeatherData = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&hourly=rain`
      );
      const { elevation, hourly } = response.data;
      const { temperature } = response.data.current_weather;
      const currentHourIndex = new Date().getHours(); // Get current hour index

      // Update form data with fetched values
      setFormData({
        ...formData,
        altitude: elevation / 1000, // Convert to km (OpenMeteo gives in meters)
        temperature: temperature,
        humidity: hourly.relative_humidity_2m[currentHourIndex],
        rainfall: hourly.rain[currentHourIndex],
      });
      setLocationFetched(true); // Indicate data has been auto-filled
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  // Function to get location and fetch weather data
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Fetch weather and elevation data using Open-Meteo API
          fetchWeatherData(latitude, longitude);
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Function to predict crop
  const cropPrediction = async () => {
    let res = await predictCrops(formData);
    setPrediction(res);
  };

  // Convert the prediction markdown into sanitized HTML
  const renderMarkdown = (text) => {
    const rawMarkup = marked(text || ""); // Convert markdown to HTML
    const sanitizedHtml = DOMPurify.sanitize(rawMarkup); // Sanitize HTML to avoid XSS attacks
    return { __html: sanitizedHtml };
  };

  return (
    <>
      <Heading text={"Crop Predictor"} textAlign="text-center" />
      <div className="container max-w-screen-lg mx-auto">
        <div>
          <div className="bg-white px-4">
            <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-full">
                <form
                  className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    cropPrediction();
                  }}
                >
                  {/* Soil input */}
                  <div className="md:col-span-6">
                    <label htmlFor="soil">Soil</label>
                    <select
                      name="soil"
                      required
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      onChange={(e) => {
                        setFormData({ ...formData, soil: e.target.value });
                      }}
                    >
                      <option value="" disabled selected>
                        Select Soil
                      </option>
                      <option value="sandy soil">
                        Sandy Soil (रेतीली मिट्टी)
                      </option>
                      <option value="clay soil">Clay Soil (मिट्टी)</option>
                      <option value="silt soil">Silt Soil (गाद मिट्टी)</option>
                      <option value="peat soil">Peat Soil (पीट मिट्टी)</option>
                      <option value="chalk soil">
                        Chalk Soil (चाक मिट्टी)
                      </option>
                      <option value="loam soil">Loam Soil (दोमट मिट्टी)</option>
                    </select>
                  </div>

                  {/* Button to fetch location */}
                  <div className="md:col-span-6">
                    <button
                      type="button"
                      className="inline-flex justify-center items-center bg-red-700 text-white font-semibold py-2 px-4 rounded cursor-pointer"
                      onClick={handleGetLocation}
                    >
                      {loadingLocation ? (
                        <Spinner width="w-5" color="#ffffff" />
                      ) : (
                        "Get Location Data"
                      )}
                    </button>
                  </div>

                  {/* Altitude, Temperature, Humidity, Rainfall Inputs */}
                  <div className="md:col-span-6">
                    <InputTag
                      label={"Altitude (in km)"}
                      type={"number"}
                      placeholder={"Between 0 and 10 (kilometers)"}
                      value={formData.altitude}
                      setFormData={setFormData}
                      toUpdate={"altitude"}
                      disabled={locationFetched}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputTag
                      label={"Temperature (in °C)"}
                      type={"number"}
                      placeholder={"Between -50 and 50 (°Celsius)"}
                      value={formData.temperature}
                      setFormData={setFormData}
                      toUpdate={"temperature"}
                      disabled={locationFetched}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputTag
                      label={"Humidity (in %)"}
                      type={"number"}
                      placeholder={"Between 0 and 100 (%)"}
                      value={formData.humidity}
                      setFormData={setFormData}
                      toUpdate={"humidity"}
                      disabled={locationFetched}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputTag
                      label={"Rainfall (in mm)"}
                      type={"number"}
                      placeholder={"Between 0 and 1000 (mm)"}
                      value={formData.rainfall}
                      setFormData={setFormData}
                      toUpdate={"rainfall"}
                      disabled={locationFetched}
                    />
                  </div>

                  {/* Predict button */}
                  <div className="md:col-span-6 my-2 text-right">
                    <button
                      type="submit"
                      className="inline-flex text-white justify-center items-center bg-rose-700 hover:bg-rose-600 font-semibold py-2 px-4 rounded cursor-pointer"
                    >
                      {isLoading && <Spinner width="w-5" color="#ffffff" />}
                      Predict Crops
                    </button>
                  </div>

                  {/* Render AI prediction with markdown formatting */}
                  <div className="md:col-span-full">
                    <div
                      className="border py-2 mt-1 rounded px-4 w-full bg-gray-50 overflow-auto"
                      style={{
                        whiteSpace: "pre-wrap",
                        height: "250px",
                        // resize: "none",
                      }}
                      dangerouslySetInnerHTML={renderMarkdown(prediction)}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CropSenseAI;