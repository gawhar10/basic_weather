import { useState, useEffect } from 'react';

const App = () => {
  const [weatherData, setWeatherData] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [refreshTime, setRefreshTime] = useState("");
  const [wmoWeather, setWmoWeather] = useState("");
  const [PM10Current, setPM10Current] = useState("");
  const [PM2_5Current, setPM2_5Current] = useState("");

  // functions for form field
  const [cityName, setCityName] = useState("");
  const [cityList, setCityList] = useState([]);
  const [menuShow, setMenuShow] = useState(false);

  const getLocationsFn = async (cityName) => {
    try {
      const locationUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=3&language=en&format=json`;
      const response = await fetch(locationUrl);
      const responseJson = await response.json();
      // always send mapped data in return from an API.
      const locations = responseJson.results.map((location) => {
        return location;
      });
      return locations;
    } catch (error) {
      console.error('error', error);
    }
  };

  const makeRoundISOTimeFn = (ISOTime) => {
    // making round hour ISOTime. ie 09:00, 10:00 instead
    // of 09:30, 09:45.
    const time = ISOTime.split(':');
    if (time[1] !== 0) {
      time.pop();
      time.push("00");
    }
    const newTime = time.join(":");
    return newTime;
  };

  const makeRegularTimeFn = (ISOTime) => {
    const date = new Date(ISOTime);
    const commonDate = date.toDateString().split(' ');
    commonDate.pop();
    const commonTime = date.toLocaleTimeString();
    const temp1 = commonTime.split(':');
    const temp2 = commonTime.split(' ');
    const CommonTime = `${temp1[0]}:${temp1[1]} ${temp2[1].toUpperCase()}`;
    return `${commonDate.join(' ')}, ${CommonTime}`;
  };

  const getAQIFn = async (latitude, longitude, ISOTime) => {
    try {
      // get AQI.
      const AQIUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5`;
      // console.log(AQIUrl);
      const response = await fetch(AQIUrl);
      const AQIData = await response.json();
      const newTime = makeRoundISOTimeFn(ISOTime);
      const index = AQIData.hourly.time.indexOf(newTime);
      const pm10 = AQIData.hourly.pm10[index];
      const pm2_5 = AQIData.hourly.pm2_5[index];
      setPM10Current(pm10);
      setPM2_5Current(pm2_5);
    } catch (error) {
      console.log('error:', error);
    }
  };

  const WMOWeatherCodeFn = (weatherCode) => {
    const wmoCodes = {
      0: 'clear sky',
      1: 'mainly clear',
      2: 'partly cloudy',
      3: 'overcast',
      45: 'fog',
      48: 'depositing rime fog',
      51: 'drizzle light',
      53: 'drizzle moderate',
      55: 'drizzle dense',
      56: 'freezing Drizzle light',
      57: 'freezing Drizzle dense',
      61: 'rain slight',
      63: 'rain moderate',
      65: 'rain heavy',
      66: 'freezing Rain light',
      67: 'freezing Rain heavy',
      71: 'snow fall slight',
      73: 'snow fall moderate',
      75: 'snow fall heavy',
      77: 'snow grains',
      80: 'rain showers slight',
      81: 'rain showers moderate',
      82: 'rain showers violent',
      85: 'snow showers slight',
      86: 'snow showers heavy',
      95: 'thunderstorm slight',
      96: 'thunderstorm moderate',
      99: 'thunderstorm heavy'
    };

    for (let code in wmoCodes) {
      if (code == weatherCode) {
        return wmoCodes[code].toUpperCase();
      }
    }
  };

  const getWeatherFn = async (latitude, longitude) => {
    try {

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const response = await fetch(weatherUrl);
      // console.log(weatherUrl);
      const responseJson = await response.json();
      setWeatherData(responseJson);
      const weatherCode = responseJson.current.weather_code;
      const weatherCodeMeaning = WMOWeatherCodeFn(weatherCode);
      setWmoWeather(weatherCodeMeaning);
      // console.log(wmoWeather, weatherCodeMeaning);
      const ISOTime = responseJson.current.time;
      const regularTime = makeRegularTimeFn(ISOTime);
      setRefreshTime(regularTime);
      getAQIFn(latitude, longitude, ISOTime);
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const citySelectHandler = (latitude, longitude, city) => {
    setMenuShow(false);
    setCurrentCity(city);
    // console.log(`latitude: ${latitude}, longitude: ${longitude}`);
    const cityInfo = [latitude, longitude, city];
    localStorage.setItem('cityInfo', JSON.stringify(cityInfo));
    getWeatherFn(latitude, longitude);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cityName) {
      // if the function is using async await then its 
      // variable should also use async and await.
      const locations = await getLocationsFn(cityName);
      setCityList(locations);
      setMenuShow(true);
    }
  };

  useEffect(() => {
    // check if city and its location is there in localhost.
    if (JSON.parse(localStorage.getItem('cityInfo'))) {
      const cityInfo = JSON.parse(localStorage.getItem('cityInfo'));
      setCurrentCity(cityInfo[2]);
      getWeatherFn(cityInfo[0], cityInfo[1]);
    }
  }, []);

  const refeshPageFn = () => {
    let lastUpdated = refreshTime.split(' ');
    lastUpdated = lastUpdated[3].split(':');
    const date = new Date();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    // check if city and its location is there in localhost.
    if (JSON.parse(localStorage.getItem('cityInfo'))) {
      const cityInfo = JSON.parse(localStorage.getItem('cityInfo'));
      if (Number(lastUpdated[1]) + 20 < minutes || Number(lastUpdated[0]) + 1 === hours) {
        setCurrentCity(cityInfo[2]);
        getWeatherFn(cityInfo[0], cityInfo[1]);
        console.log('page refreshed!');
      }
      else {
        console.log('Page not refreshed!');
      }
    }
  };


  return (
    <main>
      <header>
        <div>
          <img src={`/images/${wmoWeather.toLowerCase()}.svg`} alt="logo" />
          <h1>Only Weather</h1>
        </div>
        <button onClick={refeshPageFn}><img src="./images/refresh.svg" alt="refresh button" /></button>
      </header>
      <section>
        <form onSubmit={handleSubmit}>
          <input type="text" id="cityName" value={cityName} onChange={(e) => setCityName(e.target.value)} />
          <button type="submit">Search </button>
        </form>
        {menuShow ? (
          <div className="city_menu_container">
            <ul>
              {cityList.map((city) => {
                const { admin1, country, id, latitude, longitude, name, } = city;
                return (
                  <li key={id}><a onClick={() => citySelectHandler(latitude, longitude, name)}>{name}, {admin1}, {country}</a></li>
                );
              })}
            </ul>
          </div>) : (<p></p>)
        }
      </section>
      <section className="icon_temp_container">
        <img src={`/images/${wmoWeather.toLowerCase()}.svg`} alt="icon"></img>
        <h1>{weatherData ? (weatherData.current.temperature_2m) : 'na'}&deg;</h1>

      </section>
      <section className="weather_type_container">
        <p>{wmoWeather ? wmoWeather : 'na'}</p>
        <p> {weatherData ? (refreshTime) : 'na'} </p>
      </section>
      <section className="city_name_container">
        <p>{currentCity}</p>
      </section>
      <section className="weather_details_container">
        <div>
          <p>H:{weatherData ? (weatherData.daily.temperature_2m_max[0]) : 'na'}&deg;</p>
          <p>L:{weatherData ? (weatherData.daily.temperature_2m_min[0]) : 'na'}&deg;</p>
        </div>
        <div>
          <p>Humidity</p>
          <p>{weatherData ? (weatherData.current.relative_humidity_2m) : 'na'}%</p>
        </div>
        <div>
          <p>Wind</p>
          <p>{weatherData ? (weatherData.current.wind_speed_10m) : 'na'}km/h</p>
        </div>
      </section>
      <section className='AQI_container'>
        <div>
          <p>PM10</p>
          <p>{currentCity ? (PM10Current) : 'na'} μg/m³</p>
        </div>
        <div>
          <p>PM2.5</p>
          <p>{currentCity ? (PM2_5Current) : 'na'} μg/m³</p>
        </div>
      </section>
      <footer>This app made possible by <a href='https://open-meteo.com/' target='_blank' rel='noopener noreferrer'>open-meteo.com</a>.</footer>
    </main>
  )
}

export default App;