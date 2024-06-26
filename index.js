const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const dns = require('dns')
const { MongoClient } = require('mongodb');
require('dotenv').config()
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;

const uri = process.env.DB;
const client = new MongoClient(uri);
const db = client.db('test')
const urls = db.collection('urlshortens')

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body
  let hostName = null
  try {
    const newUrl = new URL(url)
    hostName = newUrl.hostname
    console.log(newUrl);
  } catch (e) {
    console.log(e)
  }
  dns.lookup(hostName, options, async (err, address) => {
    console.log(`${err} \n ${address}`);
    if (!address || err) {
      res.json({
        'error': 'Invalid Hostname'
      })
    } else {
      const urlCounts = await urls.countDocuments({})
      const urlFind = await urls.findOne({original_url: url}, {projection: {_id: 0}})
      console.log(urlFind);
      if (urlFind != null) {
        res.json(urlFind)
      } else {
        const obj = 
        await urls.insertOne({
          original_url: url,
          short_url: urlCounts + 1
        })
        console.log(obj);
        res.json({
          original_url: url,
          short_url: urlCounts + 1
        })
      }
    }
  });
})

app.get('/api/shorturl/:id', async (req, res) => {
  const {id} = req.params
  console.log(id);
  let shortUrl = parseInt(id)
  const locateUrl = await urls.findOne({short_url: shortUrl})
  if (locateUrl == null) {
    res.json({
      "error": "No short URL found for the given input"
    })
  }
  res.writeHead(302, {'location': locateUrl.original_url})
  res.end()
}) 

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
