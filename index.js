require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');
const MUSTACHE_MAIN_DIR = './main.mustache';

const githubApiUrl = 'https://api.github.com/user';
const githubToken = process.env.GITHUB_TOKEN; // Your GitHub token
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


// Fetch the user's information from the GitHub API
async function fetchUserInfo() {
  try {
    const response = await fetch(githubApiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        'User-Agent': 'GitHub-Hello-App',
      },
    });

    if (response.status === 200) {
      const user = await response.json();
      DATA.username = user.login; // Return the GitHub username
    } else {
      DATA.username = null; // User not logged in or other error
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}
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

  try {
    const response = await fetch(rssFeedUrl);
    if (response.status === 200) {
      const data = await response.json();
      DATA.posts = data.items.slice(0, 3);
    }else{
      console.error('Error fetching data from RSS feed.');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
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

  await fetchUserInfo();

  await setMediumPosts();


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