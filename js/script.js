console.log('JS Loaded...');

// http://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=64e0914eb8119cbb653af234bd6f322e
// APIs
const API_KEY = '64e0914eb8119cbb653af234bd6f322e';
const BASE_ENDPOINT = `http://api.openweathermap.org/data/2.5/weather`; // `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${API_KEY}`;
//const FORECAST_BASE_ENDPOINT = `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${API_KEY}`;
const CITY_BASE_ENDPOINT = "https://api.teleport.org/api/cities/?search=";

// internal variables
let searchForm = document.querySelector('.search__weather--form');
let searchInput = document.querySelector('.search__weather');
let city = document.querySelector('.weather__city');
let day = document.querySelector('.weather__day');
let humidity = document.querySelector('.weather__indicator--humidity>.value');  //inserrt into span class value
let wind = document.querySelector('.weather__indicator--wind>.value');
let pressure = document.querySelector('.weather__indicator--pressure>.value');
let image = document.querySelector('.weather__image');
let temperature = document.querySelector('.weather__temperature');
let forecastBlock = document.querySelector('.weather__forecast');
const searchSuggestions = document.querySelector('.search-suggestions')

// images for different weather conditions represented by codes
const weatherImages = [
    {
        url: 'img/clear-sky.png',
        ids: [800]
    },
    {
        url: 'img/broken-clouds.png',
        ids: [803, 804]
    },
    {
        url: 'img/few-clouds.png',
        ids: [801]
    },
    {
        url: 'img/mist.png',
        ids: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781]
    },
    {
        url: 'img/rain.png',
        ids: [500, 501, 502, 503, 504]
    },
    {
        url: 'img/scattered-clouds.png',
        ids: [802]
    },
    {
        url: 'img/shower-rain.png',
        ids: [520, 521, 522, 531, 300, 301, 302, 310, 311, 312, 313, 314, 321]
    },
    {
        url: 'snow.png',
        ids: [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622]
    },
    {
        url: 'thunderstorm.png',
        ids: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232]
    },
]




const _dayOfWeek = () => {
    return new Date().toLocaleDateString('en-EN', { 'weekday': 'long' });
}

// functions 
function getWindDirection (angle) {
    let windDirection;

    if (angle > 45 && angle <= 135) {
        windDirection = 'East'
    } else if (angle > 135 && angle <= 225) {
        windDirection = 'South'
    } else if (angle > 225 && angle <= 315) {
        windDirection = 'West'
    } else {
        windDirection = 'North'
    }

    return windDirection

}


function _formatCityStr(cityStr){ 
    // handle city name with more than 2 commas to City, COUNTRY
    // eg for New York, NewYork, USA return New York, USA.
    let cityName;

    if (cityStr.includes(',')) {
        cityName = cityStr.substring(0, cityStr.indexOf(',')) + ', ' + cityStr.substring(cityStr.lastIndexOf(','));
    } else {
        cityName = cityStr;
    }

    return cityName
}


const getWeatherByCityName = async function (cityStr) {
    // http://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=64e0914eb8119cbb653af234bd6f322e
    let city = _formatCityStr(cityStr);


    let endpoint = `${BASE_ENDPOINT}?q=${city}&APPID=${API_KEY}`;
    let response = await fetch(endpoint);

    console.log("response staus code: " + response.status_code);

    if (response.status_code !== 200) {
        // alert('City not found!')
        alert(response);
        console.log(response);
        return; //guard clause
    } else{
        let weather = await response.json();
        return weather
    }
}






// updates current weather on webpage
function updateCurrentWeather(data) {
    city.textContent = `${data.sys.name}, ${data.sys.country}`;
    day.textContent = _dayOfWeek(); // today();
    humidity.textContent = data.main.humidity;
    pressure.textContent = data.main.pressure;

    //wind
    let angle = data.wind.deg;
    let speed = data.wind.speed;
    wind.textContent = `${getWindDirection(angle)}, ${speed}`;
    temperature.textContent = data.main.temp > 0 ? `+${Math.round(data.main.temp)}` : `+${Math.round(data.main.temp)}`;

    let imgID = data.weather[0].id;

    // loop through imgs
    weatherImages.forEach((img) => {
        if (img.ids.includes(imgID)) {
            img.src = img.url;
        }
    });
}




// we use ID since it is already 
// returned in getWeatherByCityName()
const getForecastByCityId = async function (cityID) {
    let endpoint = FORECAST_BASE_ENDPOINT + '&id=' + cityID;
    let res = await fetch(endpoint);

    if (res.status_code !== 200) {
        alert(`City with id ${cityID} not found!`);
        return; //guard clause
    }

    let forecast = await res.json();
    let forecastList = forecast.list; // 5 day forecast in a list
    let daily = [];

    forecastList.forEach((day) => {
        //enforce JS Date format of ('YYYY-MM-DDTHH:mm:ss')
        let date = new Date(day.dt_txt.replace(' ', 'T'))
        let hours = date.getHours();


        if (hours === 12) {
            daily.push(day);
        }

    });

}


// updates 5 days forecast on webpage
const updateForecast = function (forecast) {

    forecastBlock.innerHTML = ''; // empty container first

    forecast.forEach((day) => {
        // set appropriate weather icon
        let iconUrl = 'https://api.openweathermap.org/img/wn/' + day.weather[0].icon + '@2x';
        let dayName = dayOfWeek(day.dt * 1000); // to turn into epoch time ms
        let temperature = day.main.temp > 0 ? `+${Math.round(day.main.temp)}` : day.main.temp;

        let forecastItem = `
            <article class="weather__forecast--item">
                <img src="${iconUrl}" alt="${day.weather[0].description}" class="weather__forecast--icon">
                <h3 class="weather__forecast--day">${dayName}</h3>
                <p class="weather__forecast--temperature"><span class="value">${temperature}</span>&deg;C</p>
            </article>
        `;

        forecastBlock.insertAdjacentElement('beforeend', forecastItem);

    });
}



// event listeners
searchForm.addEventListener('submit', async function(e){

    // enter: keyCode 13
    let weather = await getWeatherByCityName(searchInput.value);
    


    if (searchInput.value === ''){
        return;
    }


    if (!weather) {
        console.log("Weather not found");
        alert("Weather not found");
        return; //guard clause
    }

    let cityID = weather.id;
    let forecast = await getForecastByCityId(cityID);

    // update  on site
    updateCurrentWeather(weather);
    updateForecast(forecast);
});





searchInput.addEventListener('keypress', async (e) => {
    console.log(searchInput.value);
    console.log(e.keyCode);

    // enter:keyCode 13
    if (e.keyCode === 13) {
        let searchVal = searchInput.value;

        if (searchVal === ''){
            return;
        }

        let weather = await getWeatherByCityName(searchVal); // will returnid

        if (!weather) {
            return; // guard clause
        }

        let cityID = weather.id;
        let forecast = await getForecastByCityId(cityID);

        // update  on site
        updateCurrentWeather(weather);
        updateForecast(forecast); 
    }
});





// show suggestions using teleport API
searchInput.addEventListener('keypress', async () => {
    let endpoint = CITY_BASE_ENDPOINT + searchInput.value;
    const resp = await fetch(endpoint);
    let result = await resp.json();

    searchSuggestions.innerHTML = '';
    let cities = result._embedded['city:search-results'];

    // only display upto 5 suggestions
    let length = cities.length > 5 ? 5 : cities.length;
    for (let i; i <= length; i++) {
        let option = document.createElement('option');
        option.value = cities[i].matching_full_name;
        searchSuggestions.appendChild(option);
    }

});




// init app
function init(){
    getWeatherByCityName('Nairobi')
    .then(() => {
        document.body.style.filter = 'blur(0)';
    })
    .catch((err) => {
        alert(err);

        console.error(err);
    });
}

init();
 