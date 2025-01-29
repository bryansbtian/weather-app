const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const Weather = require("./models/Weather");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://bryanseb:1234@cluster0.7qfj2.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// WeatherAPI API Key
const API_KEY = "792f379be8ec456ab46145409252801";

// CREATE - Add weather data
app.post("/api/weather", async (req, res) => {
  const { location, startDate, endDate } = req.body;

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ error: "Invalid date range" });
  }

  try {
    let temperatures = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      let dateString = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD

      console.log(`Fetching weather data for ${dateString}`);

      // Fetch historical weather data from WeatherAPI
      const weatherResponse = await axios.get(
        `http://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${location}&dt=${dateString}`
      );

      console.log("API Response:", weatherResponse.data);

      if (
        !weatherResponse.data.forecast ||
        !weatherResponse.data.forecast.forecastday[0]
      ) {
        return res
          .status(500)
          .json({ error: `Temperature data missing for ${dateString}` });
      }

      const tempCelsius =
        weatherResponse.data.forecast.forecastday[0].day.avgtemp_c;
      temperatures.push({ date: dateString, temperature: tempCelsius });

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save to MongoDB
    const weather = new Weather({ location, startDate, endDate, temperatures });
    await weather.save();

    res.status(201).json(weather);
  } catch (error) {
    console.error(
      "API Fetch Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch or save weather data" });
  }
});

// READ - Get all weather data
// READ - Get all weather data or filter by location & date range
app.get("/api/weather", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    let query = {};

    if (location) {
      query.location = location;
    }

    if (startDate && endDate) {
      query["temperatures.date"] = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    console.log("Executing Query:", query); // Debugging line
    const weatherData = await Weather.find(query);

    if (weatherData.length === 0) {
      console.log("No weather data found for query:", query); // Debugging line
    }

    res.json(weatherData);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.get("/api/weather/pdf/:id", async (req, res) => {
  try {
    const weather = await Weather.findById(req.params.id);
    if (!weather) return res.status(404).send("Weather data not found");

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `weather-report-${weather._id}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text("Weather Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Location: ${weather.location}`);
    doc.text(`Start Date: ${new Date(weather.startDate).toLocaleDateString()}`);
    doc.text(`End Date: ${new Date(weather.endDate).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text("Temperature Data:");
    weather.temperatures.forEach((temp) => {
      doc.text(
        `${new Date(
          temp.date
        ).toLocaleDateString()}: ${temp.temperature.toFixed(2)}°C`
      );
    });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});

// UPDATE - Update weather data by ID
app.put("/api/weather/:id", async (req, res) => {
  const { id } = req.params;
  const { location, startDate, endDate } = req.body;

  try {
    const weather = await Weather.findById(id);
    if (!weather)
      return res.status(404).json({ error: "Weather data not found" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end)
      return res.status(400).json({ error: "Invalid date range" });

    const today = new Date();
    let temperatures = [];

    // Step 1: Fetch 14-day forecast upfront
    let forecastData = [];
    try {
      const forecastResponse = await axios.get(
        `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=14`
      );
      forecastData = forecastResponse.data.forecast.forecastday;
      console.log(
        "Forecast data fetched:",
        forecastData.map((d) => d.date)
      );
    } catch (forecastError) {
      console.error("Forecast API Error:", forecastError.message);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }

    // Step 2: Iterate through each date
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split("T")[0];
      console.log(`Processing date: ${dateString}`);

      try {
        if (currentDate > today) {
          // Use forecast data
          const forecastDay = forecastData.find((d) => d.date === dateString);
          if (!forecastDay) {
            console.error(`Date ${dateString} exceeds 14-day forecast limit`);
            throw new Error("Forecast limit exceeded");
          }
          temperatures.push({
            date: dateString,
            temperature: forecastDay.day.avgtemp_c,
          });
        } else {
          // Use historical data
          const historyResponse = await axios.get(
            `http://api.weatherapi.com/v1/history.json?key=${API_KEY}&q=${location}&dt=${dateString}`
          );
          const historyDay = historyResponse.data.forecast?.forecastday?.[0];
          if (!historyDay) {
            console.error(`No historical data for ${dateString}`);
            throw new Error("Historical data missing");
          }
          temperatures.push({
            date: dateString,
            temperature: historyDay.day.avgtemp_c,
          });
        }
      } catch (error) {
        console.error(`Failed for ${dateString}:`, error.message);
        // Optionally: Skip failed dates instead of aborting
        // temperatures.push({ date: dateString, temperature: null });
        return res
          .status(500)
          .json({ error: `Failed for ${dateString}: ${error.message}` });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update database
    weather.location = location;
    weather.startDate = startDate;
    weather.endDate = endDate;
    weather.temperatures = temperatures;
    await weather.save();

    res.json({ message: "Weather data updated successfully", weather });
  } catch (error) {
    console.error("Update failed:", error.message);
    res.status(500).json({ error: "Failed to update weather data" });
  }
});

// DELETE - Delete weather data by ID
// DELETE - Delete weather data by ID
app.delete("/api/weather/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Delete request received for ID: ${id}`);

  try {
    const weather = await Weather.findByIdAndDelete(id);
    if (!weather) {
      console.log(`Weather data not found for ID: ${id}`);
      return res.status(404).json({ error: "Weather data not found" });
    }

    console.log(`Weather data deleted successfully for ID: ${id}`);
    res.json({ message: "Weather data deleted successfully" });
  } catch (error) {
    console.error("Failed to delete weather data:", error);
    res.status(500).json({ error: "Failed to delete weather data" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
