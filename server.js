/*
 * Unreal Speech
 * Copyright (c) 2023, All Rights Reserved.
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');


// server

const app = express();
const port = process.env.PORT || 8888;

app.set('view engine', 'ejs');
app.use('/dist', express.static('dist'));
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


// routes

app.get('/', async function (req, res) 
{
  res.render('index', {
    random: Math.floor(Math.random()*100000)
  });
});

app.post('/api/get-vocal', async function (req, res) 
{
  // get text
  var text = req.body.text;
  var voice_id = req.body.voice_id;
  var api_key = req.body.api_key;

  console.log("/api/get-vocal - api_key: "+api_key+" voice_id: "+voice_id+" text: "+text);

  var url = 'https://api.v6.unrealspeech.com/speech';

  var payload = JSON.stringify({
    "Text": text,
    "VoiceId": voice_id, 
    "Bitrate": "192k",
    "TimestampType": "word"
  });

  var headers = {
    'Authorization': 'Bearer '+api_key,
    'Content-Type': 'application/json'
  };

  try {
    const audio = await axios.post(url, payload, { headers });
    const audio_url = audio.data.OutputUri;
    const words_url = audio.data.TimestampsUri;

    console.log("audio_url: "+audio_url)
    console.log("words_url: "+words_url)

    res.status(200).send(JSON.stringify({
      success: true,
      audio_url: audio_url,
      words_url: words_url,
    }));
  }
  catch (error) {
    console.log("[ERROR] /api/get-vocal", error)

    res.status(500).send(JSON.stringify({
      success: false,
      error: error
    }));
  }
});


