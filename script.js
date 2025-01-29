let cityInput = document.getElementById("city_input"),
  searchBtn = document.getElementById("searchBtn"),
  saveBtn = document.getElementById("saveBtn"),
  locationBtn = document.getElementById("locationBtn"),
  api_key = "581d095ed5cf0f0591d592514eeb27cb",
  currentWeatherCard = document.querySelectorAll(".weather-left .card")[0],
  fiveDaysForecastCard = document.querySelector(".day-forecast"),
  aqiCard = document.querySelectorAll(".highlights .card")[0],
  sunriseCard = document.querySelectorAll(".highlights .card")[1],
  humidityVal = document.getElementById("humidityVal"),
  pressureVal = document.getElementById("pressureVal"),
  visibilityVal = document.getElementById("visibilityVal"),
  windSpeedVal = document.getElementById("windSpeedVal"),
  feelsVal = document.getElementById("feelsVal"),
  hourlyForecastCard = document.querySelector(".hourly-forecast"),
  aqiList = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
// Get modal elements
const modal = document.getElementById("pmModal");
const infoBtn = document.getElementById("infoBtn");
const span = document.getElementsByClassName("close")[0];

// Show modal when info button is clicked
infoBtn.onclick = function () {
  modal.style.display = "block";
};

// Close modal when X is clicked
span.onclick = function () {
  modal.style.display = "none";
};

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function getWeatherDetails(name, lat, lon, country, state) {
  let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast/?lat=${lat}&lon=${lon}&appid=${api_key}`,
    WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`,
    AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`,
    days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

  fetch(AIR_POLLUTION_API_URL)
    .then((res) => res.json())
    .then((data) => {
      let { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
      aqiCard.innerHTML = `
    <div class="card-head">
        <p>Air Quality Index</p>
        <p class="air-index aqi-${data.list[0].main.aqi}">${
        aqiList[data.list[0].main.aqi - 1]
      }</p>
    </div>
    <div class="air-indices">
        <i class="fa-regular fa-wind fa-3x"></i>
        <div class="item">
            <p>PM2.5</p>
            <h2>${pm2_5}</h2>
        </div>
        <div class="item">
            <p>PM10</p>
            <h2>${pm10}</h2>
        </div>
        <div class="item">
            <p>SO2</p>
            <h2>${so2}</h2>
        </div>
        <div class="item">
            <p>CO</p>
            <h2>${co}</h2>
        </div>
        <div class="item">
            <p>NO</p>
            <h2>${no}</h2>
        </div>
        <div class="item">
            <p>NO2</p>
            <h2>${no2}</h2>
        </div>
        <div class="item">
            <p>NH3</p>
            <h2>${nh3}</h2>
        </div>
        <div class="item">
            <p>O3</p>
            <h2>${o3}</h2>
        </div>
    </div>
      `;
    })
    .catch(() => {
      alert("Failed to fetch Air Quality Index");
    });

  fetch(WEATHER_API_URL)
    .then((res) => res.json())
    .then((data) => {
      let date = new Date();
      let description = data.weather[0].description;
      description = description
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      currentWeatherCard.innerHTML = `
        <div class="current-weather">
            <div class="details">
                <p>Now</p>
                <h2>${(data.main.temp - 273.15).toFixed(2)}&deg;C</h2>
                <p>${description}</p>
            </div>
            <div class="weather-icon">
                <img
                  src="https://openweathermap.org/img/wn/${
                    data.weather[0].icon
                  }@2x.png"
                  alt=""
                />
            </div>
        </div>
        <hr />
        <div class="card-footer">
            <p><i class="fa-light fa-calendar"></i>${
              days[date.getDay()]
            }, ${date.getDate()}, ${
        months[date.getMonth()]
      } ${date.getFullYear()}</p>
            <p><i class="fa-light fa-location-dot"></i>${name}, ${country}</p>
        </div>
        `;
      let { sunrise, sunset } = data.sys,
        { timezone, visibility } = data,
        { humidity, pressure, feels_like } = data.main,
        { speed } = data.wind,
        sRiseTime = moment
          .utc(sunrise, "X")
          .add(timezone, "seconds")
          .format("hh:mm A"),
        sSetTime = moment
          .utc(sunset, "X")
          .add(timezone, "seconds")
          .format("hh:mm A");
      sunriseCard.innerHTML = `
      <div class="card-head">
        <p>Sunrise & Sunset</p>
      </div>
      <div class="sunrise-sunset">
        <div class="item">
          <div class="icon">
            <i class="fa-light fa-sunrise fa-4x"></i>
          </div>
          <div>
            <p>Sunrise</p>
            <h2>${sRiseTime}</h2>
          </div>
        </div>
        <div class="item">
          <div class="icon">
            <i class="fa-light fa-sunset fa-4x"></i>
          </div>
          <div>
            <p>Sunset</p>
            <h2>${sSetTime}</h2>
          </div>
        </div>
      </div>
      `;
      humidityVal.innerHTML = `${humidity}%`;
      pressureVal.innerHTML = `${pressure}hPa`;
      visibilityVal.innerHTML = `${visibility / 1000}km`;
      windSpeedVal.innerHTML = `${speed}m/s`;
      feelsVal.innerHTML = `${(feels_like - 273.15).toFixed(2)}&deg;C`;
    })
    .catch(() => {
      alert("Failed to fetch current weather");
    });

  fetch(FORECAST_API_URL)
    .then((res) => res.json())
    .then((data) => {
      let hourlyForecast = data.list;
      hourlyForecastCard.innerHTML = "";
      for (i = 0; i <= 7; i++) {
        let hrForecastDate = new Date(hourlyForecast[i].dt_txt);
        let hr = hrForecastDate.getHours();
        let a = "PM";
        if (hr < 12) a = "AM";
        if (hr == 0) hr = 12;
        if (hr > 12) hr = hr - 12;
        hourlyForecastCard.innerHTML += `
        <div class="card">
          <p>${hr} ${a}</p>
          <img src="https://openweathermap.org/img/wn/${
            hourlyForecast[i].weather[0].icon
          }.png" alt="" />
          <p>${(hourlyForecast[i].main.temp - 273.15).toFixed(2)}&deg;C</p>
        </div>
        `;
      }
      let uniqueForecastDays = [];
      let fiveDaysForecast = data.list.filter((forecast) => {
        let forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.includes(forecastDate)) {
          return uniqueForecastDays.push(forecastDate);
        }
      });
      fiveDaysForecastCard.innerHTML = "";
      for (i = 1; i < fiveDaysForecast.length; i++) {
        let date = new Date(fiveDaysForecast[i].dt_txt);
        fiveDaysForecastCard.innerHTML += `
        <div class="day-forecast">
            <div class="forecast-item">
                <div class="icon-wrapper">
                  <img src="https://openweathermap.org/img/wn/${
                    fiveDaysForecast[i].weather[0].icon
                  }.png" alt="" />
                  <span>${(fiveDaysForecast[i].main.temp - 273.15).toFixed(
                    2
                  )}&deg;C</span>
            </div>
            <p>${date.getDate()} ${months[date.getMonth()]}</p>
            <p>${days[date.getDay()]}</p>
        </div>
        `;
      }
    })
    .catch(() => {
      alert("Failed to fetch current weather");
    });
}

function getCityCoordinates() {
  let cityName = cityInput.value.trim();
  cityInput.value = "";
  if (!cityName) return;

  if (/^\d{5}$/.test(cityName)) {
    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/zip?zip=${cityName}&appid=${api_key}`;
    fetch(GEOCODING_API_URL)
      .then((res) => res.json())
      .then((data) => {
        let { name, lat, lon, country } = data;
        getWeatherDetails(name, lat, lon, country, "");
      })
      .catch(() => {
        alert(`Failed to fetch coordinates for zip code ${cityName}`);
      });
  } else {
    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;
    fetch(GEOCODING_API_URL)
      .then((res) => res.json())
      .then((data) => {
        let { name, lat, lon, country, state } = data[0];
        getWeatherDetails(name, lat, lon, country, state);
      })
      .catch(() => {
        alert(`Failed to fetch coordinates of ${cityName}`);
      });
  }
}

function getUserCoordinates() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      let { latitude, longitude } = position.coords;
      let REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;

      fetch(REVERSE_GEOCODING_URL)
        .then((res) => res.json())
        .then((data) => {
          let { name, country, state } = data[0];
          getWeatherDetails(name, latitude, longitude, country, state);
        })
        .catch(() => {
          alert("Failed to fetch user coordinates");
        });
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert(
          "Geolocation permission denied. Please reset location permission to grant access again"
        );
      }
    }
  );
}

async function saveWeatherData() {
  let cityName = cityInput.value.trim();
  let startDate = document.getElementById("start_date").value;
  let endDate = document.getElementById("end_date").value;

  if (!cityName || !startDate || !endDate) {
    alert("Please enter all required fields.");
    return;
  }

  let data = { location: cityName, startDate, endDate };

  try {
    const response = await fetch("http://localhost:5000/api/weather", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
      alert("Weather data saved successfully!");
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    alert("Failed to save weather data.");
  }
}

async function fetchWeatherData() {
  let url = "http://localhost:5000/api/weather";

  try {
    const response = await fetch(url);
    const data = await response.json();

    let weatherDisplay = document.getElementById("weatherHistory");
    weatherDisplay.innerHTML = "<h3>Stored Weather Data</h3>";

    if (data.length === 0) {
      weatherDisplay.innerHTML += "<p>No weather data found.</p>";
      return;
    }

    data.forEach((entry) => {
      let tempHTML = `<h4>${entry.location}</h4>
                      <p><strong>Start Date:</strong> ${entry.startDate}</p>
                      <p><strong>End Date:</strong> ${entry.endDate}</p>
                      <p><strong>Temperature Data:</strong></p>
                      <ul>`;

      entry.temperatures.forEach((temp) => {
        tempHTML += `<li>${temp.date}: ${temp.temperature.toFixed(2)}°C</li>`;
      });

      tempHTML += `</ul>
                   <button onclick="updateWeatherData('${entry._id}')">Update</button>
                   <button onclick="deleteWeatherData('${entry._id}')">Delete</button>
                   <button onclick="downloadPDF('${entry._id}')">Download PDF</button>
                   <hr>`;

      weatherDisplay.innerHTML += tempHTML;
    });
  } catch (error) {
    console.error("Failed to fetch weather data", error);
  }
}

async function deleteWeatherData(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    const response = await fetch(`http://localhost:5000/api/weather/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (response.ok) {
      alert("Weather data deleted successfully!");
      fetchWeatherData(); // Refresh displayed data after deletion
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    alert("Failed to delete weather data.");
    console.error("Error deleting weather data:", error);
  }
}

async function updateWeatherData(id) {
  let newLocation = prompt("Enter new location:");
  let newStartDate = prompt("Enter new start date (YYYY-MM-DD):");
  let newEndDate = prompt("Enter new end date (YYYY-MM-DD):");

  if (!newLocation || !newStartDate || !newEndDate) {
    alert("All fields are required!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/weather/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: newLocation,
        startDate: newStartDate,
        endDate: newEndDate,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      alert("Weather data updated successfully!");
      fetchWeatherData(); // Refresh UI after update
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    alert("Failed to update weather data.");
    console.error("Error updating weather data:", error);
  }
}

function downloadPDF(id) {
  window.open(`http://localhost:5000/api/weather/pdf/${id}`);
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", () => fetchWeatherData());

document.addEventListener("DOMContentLoaded", fetchWeatherData);

searchBtn.addEventListener("click", getCityCoordinates);
saveBtn.addEventListener("click", saveWeatherData);
locationBtn.addEventListener("click", getUserCoordinates);
cityInput.addEventListener(
  "keyup",
  (e) => e.key === "Enter" && getCityCoordinates()
);
window.addEventListener("load", getUserCoordinates);
