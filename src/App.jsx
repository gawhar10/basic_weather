import { useState, useEffect } from 'react';
import './App.css';
const App = () => {
  const [weatherData, setWeatherData] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [refreshTime, setRefreshTime] = useState("");
  const [wmoWeather, setWmoWeather] = useState("");
  const [PM10Current, setPM10Current] = useState("");
  const [PM2_5Current, setPM2_5Current] = useState("");

  // States for form field.
  const [cityName, setCityName] = useState("");
  const [cityList, setCityList] = useState([]);
  const [menuShow, setMenuShow] = useState(false);

  const wallpapersId = ['1746023790801-a10185075896', '1746023790104-df44921a7a88', '1758805769600-322d4f615981', '1759778276353-96f734f8df9b', '1543187018-21e461e7538e', '1476673160081-cf065607f449', '1542875272-2037d53b5e4d', '1542708993627-b6e5bbae43c4', '1542822223-606661cf0a48', '1543227043-f69c82e95af9', '1542690970-7310221dbe09'];

  const getLocationsFn = async (cityName) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=3&language=en&format=json`;
      let response = await fetch(url);
      response = await response.json();
      setCityList(() => response['results']);
    } catch (error) {
      console.error('error', error);
    }
  };

  const makeRoundISOTimeFn = (ISOTime) => {
    // making round hour ISOTime. ie 09:00, 10:00 instead
    // of 09:30, 09:45.
    const time = ISOTime.split(':');
    if (time[1] === 0) return time.join(':');
    time.pop();
    time.push("00");
    return time.join(":");
  };

  const makeRegularTimeFn = (ISOTime) => {
    const newDate = new Date(ISOTime);
    const date = newDate.toDateString().split(' ');
    date.pop();
    const time = newDate.toLocaleTimeString().split(':');
    const amPm = time[2].split(' ')[1].toUpperCase();
    time.pop();
    return `${date.join(' ')}, ${time.join(':')}${amPm}`;
  };

  const getAQIFn = async (latitude, longitude, ISOTime) => {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5`;
      let response = await fetch(url);
      response = await response.json();
      const roundTime = makeRoundISOTimeFn(ISOTime);
      const index = response.hourly.time.indexOf(roundTime);
      setPM10Current(() => response.hourly.pm10[index]);
      setPM2_5Current(() => response.hourly.pm2_5[index]);
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
      // const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,rain_sum&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature,rain&timezone=auto`;
      let response = await fetch(weatherUrl);
      response = await response.json();
      setWeatherData({ ...response });
      setWmoWeather(() => WMOWeatherCodeFn(response.current.weather_code));
      setRefreshTime(() => makeRegularTimeFn(response.current.time));
      getAQIFn(latitude, longitude, response.current.time);
      // console.log(response);
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
      await getLocationsFn(cityName);
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

  const refeshPageFn = async () => {
    if (refreshTime) {
      const lastUpdated = refreshTime.split(' ')[3].split(':');
      let lastRefreshedMinutes = lastUpdated[1].split('');
      lastRefreshedMinutes = lastRefreshedMinutes[0] + lastRefreshedMinutes[1];
      // console.log(refreshTime, lastUpdated, lastRefreshedMinutes);
      const date = new Date();
      const minutes = date.getMinutes();
      const hours = date.getHours();
      const cityInfo = JSON.parse(localStorage.getItem('cityInfo'));
      if (Number(lastRefreshedMinutes) + 15 < minutes || Number(lastUpdated[0]) + 1 === hours) {
        const currentData = await getWeatherFn(cityInfo[0], cityInfo[1]);
        console.log('page refreshed!');
        // Random unsplash wallpaper with every refresh.
        const randomIndex = Math.floor(Math.random() * wallpapersId.length);
        document.body.style.backgroundImage = `url(https://images.unsplash.com/photo-${wallpapersId[randomIndex]}?q=100&w=1280)`;
        // document.body.style.backgroundSize = 'cover';
        // document.body.style.backgroundPosition = 'center';
        document.body.style.transition = 'background-image 0.5s ease-in-out';
      } else {
        console.log(`Page not refreshed, It's already updated!`);
      }
    } else {
      console.log(`Page not refreshed!`);
    }
  };


  return (
    <main>
      <header className='glass_card'>
        <div>
          <img src={`/images/${wmoWeather.toLowerCase()}.svg`} alt="logo" />
          <h2>Only Weather</h2>
        </div>
        <button onClick={refeshPageFn}><img src="./images/refresh.svg" alt="refresh button" /></button>
      </header>
      <section>
        <form className='glass_card' onSubmit={handleSubmit}>
          <input type="text" id="cityName" value={cityName} onChange={(e) => setCityName(e.target.value)} />
          <button type="submit">Search </button>
        </form>
        {menuShow ? (
          <div className="city_menu_container glass_card">
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
      <section className="icon_temp_container glass_card">
        <img src={`/images/${wmoWeather.toLowerCase()}.svg`} alt="icon"></img>
        <h1>{weatherData ? (weatherData.current.temperature_2m) : 'na'}&deg;</h1>

      </section>
      <section className="weather_type_container glass_card">
        <p>{wmoWeather ? wmoWeather : 'na'}</p>
        <p> {weatherData ? (refreshTime) : 'na'} </p>
      </section>
      <section className="city_name_container glass_card">
        <p>{currentCity}</p>
      </section>
      <section className="weather_details_container">
        <div className='glass_card'>
          <p>High: {weatherData ? (weatherData.daily.temperature_2m_max[0]) : 'na'}&deg;</p>
          <p>Low: {weatherData ? (weatherData.daily.temperature_2m_min[0]) : 'na'}&deg;</p>
        </div>
        <div className='glass_card'>
          <p>Humidity</p>
          <p>{weatherData ? (weatherData.current.relative_humidity_2m) : 'na'}%</p>
        </div>
        <div className='glass_card'>
          <p>Wind</p>
          <p>{weatherData ? (weatherData.current.wind_speed_10m) : 'na'}km/h</p>
        </div>
        <div className='glass_card'>
          <div>
            <p>PM2.5</p>
            <p>{currentCity ? (PM2_5Current) : 'na'} μg/m³</p>
          </div>
          <div>
            <p>PM10</p>
            <p>{currentCity ? (PM10Current) : 'na'} μg/m³</p>
          </div>
        </div>
      </section>
      <section className='sevenDay_container'>
        <div className='glass_card'>
          <p>Seven day Weather</p>
        </div>
        <div className='glass_card'>
          <p>Day</p>
          <p>Min&deg;</p>
          <p>Max&deg;</p>
          <p>Rain mm</p>
        </div>
        <ul>
          {
            weatherData ? (
              weatherData.daily.time.map((item, index) => {
                const date = new Date(weatherData.daily.time[index]);
                return (
                  <li className='glass_card' key={index}>
                    <p>{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p>{weatherData.daily.temperature_2m_min[index]}&deg;</p>
                    <p>{weatherData.daily.temperature_2m_max[index]}&deg;</p>
                    <p>{weatherData.daily.rain_sum[index]}</p>
                  </li>
                )
              })
            ) : <p></p>

          }
        </ul>
      </section>
      <footer className='glass_card'>This app made possible by <a href='https://open-meteo.com/' target='_blank' rel='noopener noreferrer'>open-meteo.com</a>.</footer>
    </main>
  )
}

export default App;