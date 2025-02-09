document.addEventListener('DOMContentLoaded', function () {
    const todayContainer = document.getElementById('today');
    const futureContainer = document.getElementById('future');
    const detailedContainer = document.getElementById('detailed');
    const detailedTitle = document.getElementById('detailed-title');
    const detailedSection = document.getElementById('detailed-forecast');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const closeDetailBtn = document.getElementById('close-detail');

    let timeseriesData = [];
    let selectedDayIndex = 0;

    const lat = 59.437;
    const lon = 24.7535;

    fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
        headers: {
            'User-Agent': 'TallinnWeatherApp/1.0 (hendrik.palandi@gmail.com)'
        }
    })
    .then(response => response.json())
    .then(data => {
        timeseriesData = data.properties.timeseries;
        updateForecasts();
    })
    .catch(error => {
        console.error('Fetch error:', error);
        todayContainer.innerHTML = "<p>Tõrge andmete laadimisel</p>";
        futureContainer.innerHTML = "<p>Tõrge andmete laadimisel</p>";
    });

    function updateForecasts() {
        const now = new Date();
        now.setMinutes(0, 0, 0); // Round down to the nearest hour
        const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        let todayForecast = "";
        let futureForecast = "";
        let dailyData = {};

        timeseriesData.forEach(entry => {
            const timestamp = entry.time;
            const temperature = entry.data.instant.details.air_temperature;
            const windSpeed = entry.data.instant.details.wind_speed;
            const windDir = entry.data.instant.details.wind_from_direction;
            const symbol = entry.data.next_1_hours?.summary?.symbol_code || entry.data.next_6_hours?.summary?.symbol_code || entry.data.next_12_hours?.summary?.symbol_code; // Fallback for missing symbol_code
            if (!symbol) console.warn("Missing symbol_code for:", entry);

            const date = new Date(timestamp);
            const formattedTime = date.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
            const formattedDate = date.toLocaleDateString('et-EE', { weekday: 'long', day: 'numeric', month: 'short' });

            const weatherDesc = getWeatherDescription(symbol);
            const windInfo = `༄ ${windSpeed} m/s ${getWindDirection(windDir)}`;

            if (date >= now && date <= endDate) {
                todayForecast += `<div class="forecast-item">
                    <div class="forecast-time">${formattedTime}</div>
                    <div class="forecast-temp">${temperature}°C</div>
                    <div class="forecast-weather">${weatherDesc}</div>
                    <div class="forecast-wind">${windInfo}</div>
                </div>`;
            }

            if (!dailyData[formattedDate]) {
                dailyData[formattedDate] = [];
            }
            dailyData[formattedDate].push({
                time: formattedTime,
                temp: temperature,
                weather: weatherDesc,
                wind: windInfo
            });
        });

        Object.keys(dailyData).slice(1, 8).forEach(date => {
            futureForecast += `<div class="forecast-item">
                <div class="forecast-time"><strong>${date} | 12:00</strong></div>
                <div class="forecast-temp">${dailyData[date][Math.floor(dailyData[date].length / 2)].temp}°C</div>
                <div class="forecast-weather">${dailyData[date][Math.floor(dailyData[date].length / 2)].weather}</div>
                <div class="forecast-wind"><button onclick="showDetailed('${date}')">Detailid</button></div>
            </div>`;
        });

        todayContainer.innerHTML = todayForecast || "<p>Andmed puuduvad</p>";
        futureContainer.innerHTML = futureForecast || "<p>Andmed puuduvad</p>";
        window.dailyData = dailyData;
    }

    window.showDetailed = function (date) {
        selectedDayIndex = Object.keys(window.dailyData).indexOf(date);
        updateDetailedView();
        detailedSection.classList.remove('hidden');
    };

    function updateDetailedView() {
        const dateKeys = Object.keys(window.dailyData);
        const selectedDate = dateKeys[selectedDayIndex];
        detailedTitle.innerText = `Ilm - ${selectedDate}`;
        detailedContainer.innerHTML = window.dailyData[selectedDate].map(entry =>
            `<div class="forecast-item">
                <div class="forecast-time">${entry.time}</div>
                <div class="forecast-temp">${entry.temp}°C</div>
                <div class="forecast-weather">${entry.weather}</div>
                <div class="forecast-wind">${entry.wind}</div>
            </div>`
        ).join('');

        prevDayBtn.disabled = selectedDayIndex <= 1;
        nextDayBtn.disabled = selectedDayIndex >= dateKeys.length - 1;
    }

    prevDayBtn.addEventListener("click", () => {
        selectedDayIndex--;
        updateDetailedView();
    });

    nextDayBtn.addEventListener("click", () => {
        selectedDayIndex++;
        updateDetailedView();
    });

    closeDetailBtn.addEventListener("click", () => {
        detailedSection.classList.add('hidden');
    });

    function getWeatherDescription(symbol) {
        const symbols = {
            "clearsky": "☀️ Selge taevas",
            "clearsky_day": "☀️ Selge taevas",
            "clearsky_night": "🌙 Selge taevas",
            "partlycloudy": "🌤 Osaliselt pilvine",
            "partlycloudy_day": "🌤 Osaliselt pilvine",
            "partlycloudy_night": "🌤 Osaliselt pilvine",
            "cloudy": "☁ Pilvine",
            "rain": "🌧 Vihm",
            "lightrain": "🌦 Vähene vihm",
            "heavyrain": "🌧🌧 Tugev vihm",
            "snow": "❅ Lumi",
            "lightsnow": "❅ Kerge lumesadu",
            "heavysnow": "❅❅ Tugev lumesadu",
            "thunderstorm": "⛈ Äike",
            "fair_day": "🌤 Hea ilm",
            "fair_night": "🌙 Hea ilm"
        };
        
        if (!symbols[symbol]) {
            console.warn("Unknown symbol:", symbol);  // Debugging
            return "❓ Tundmatu ilm";
        }
        return symbols[symbol];
    }

    function getWindDirection(angle) {
        const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        return directions[Math.round(angle / 45) % 8];
    }
});
