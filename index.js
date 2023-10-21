require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Europe/Lisbon',
  }),
};

async function setWeatherInformation() {
  await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=stockholm&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`
  )
    .then(r => r.json())
    .then(r => {
      DATA.city_temperature = Math.round(r.main.temp);
      DATA.city_weather = r.weather[0].description;
      DATA.city_weather_icon = r.weather[0].icon;
      DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Stockholm',
      });
      DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Stockholm',
      });
    });
}

async function setInstagramPosts() {
  const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount('visitstockholm', 3);
  DATA.img1 = instagramImages[0];
  DATA.img2 = instagramImages[1];
  DATA.img3 = instagramImages[2];
}

async function setMediumPosts(){
  const rssFeedUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@dumildematos';

 fetch(rssFeedUrl)
  .then((response) => response.json())
  .then((data) => {
    const posts = data.items.slice(0,3);

    const template = fs.readFileSync('main.mustache', 'utf8');

    const rendered = Mustache.render(template, { items: posts });

    fs.writeFileSync('README.md', rendered);
  })
  .catch((error) => {
    console.error('Error fetching data:', error);
  });
}

async function setGreeting(){

    // Get the user's login if available (requires authentication)
    const username = process.env.GITHUB_USER; // Set this environment variable with the user's login

    // Read the Mustache template from main.mustache
    const template = fs.readFileSync('main.mustache', 'utf8');

    // Render the template with the greeting, user, and the limited post data
    const rendered = Mustache.render(template, { username});

    // Write the rendered content to README.md
    fs.writeFileSync('README.md', rendered);
  
}

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
  /**
   * Fetch Weather
   */
  // await setWeatherInformation();

  /**
   * Get pictures
   */
  await setInstagramPosts();

  await setMediumPosts();

  await setGreeting();

  /**
   * Generate README
   */
  await generateReadMe();

  /**
   * Fermeture de la boutique 👋
   */
  await puppeteerService.close();
}

action();