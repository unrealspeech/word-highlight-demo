/*
 * Unreal Speech
 * Copyright (c) 2023, All Rights Reserved.
 */

'use strict';


// globals

var audio = {
	buffer: null,
	source: null,
	duration: null,
	start_time: null,
	loaded: false
};

var playing = false;

var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var mixer;

var playTimer;
var lastWordIndex = -1;

var audio_url = "";
var words = [];


// main

$(document).ready(function() 
{
	// setup
	setupAudio();
	startPlayTimer();
});


function setupAudio()
{
	// create mixer
	mixer = audioContext.createGain();
	mixer.gain.value = 1.0;

	mixer.connect(audioContext.destination);
}

function startPlayTimer()
{
	// start timer
	clearInterval(playTimer);
	playTimer = setInterval(function() {

		drawWords();

	}, 10); 
}

function drawWords()
{
	// skip if no words
	if (words.length == 0) {
		return;
	}

	// skip if not loaded
	if ((audio.source == null) || (playing == false)) {
		return;
	}

	// get elapsed time
	var current_time = (audioContext.currentTime - audio.start_time) + 0.1;

	// get current word
	var word_index = -1;
	for (var i=words.length-1; i>=0; i--)
	{
		if ((current_time >= words[i].start) && (current_time < words[i].end)) {
			word_index = i;
			break;
		}
	}

	// got word?
	if ((word_index != -1) && (word_index != lastWordIndex))
	{
		// clear on first word
		if (word_index == 0) {
			$("#words").text("");
		}

		// get wrap
		var words_div = $("#words");

		// add space
		words_div.append(" ");

		// add breaks
		var text = words[word_index].word;
		text = text.replace(/\n\n/g, "<br /><br />");

		// add word to wrap
		$("<span />").html(text).appendTo(words_div);
	}

	// store index
	lastWordIndex = word_index;

	// finished?
	if (current_time > (words[words.length-1].end + 0.3)) 
	{
		stopPlaying();
	}
}


function getVocal()
{
	// get api key
	var api_key = $("#api_key").val();
	if (api_key.length == 0) {
		alert("Please enter your API key.");
		return;
	}

	// get text
	var text = $("#text").val();
	if (text.length == 0) {
		alert("Please enter some text.");
		return;
	}

	$("#words").text("Generating audio...");

	// load vocal
	$.ajax({
		url: "/api/get-vocal",
		data: {  
			voice_id: "Scarlett",
			text: text,
			api_key: api_key
		},
		type: "POST",
		timeout: 15000,
		cache: false,
		dataType: "json",
		success: async function(data) 
		{
			// error?
			if (data.success == false) 
			{
				// show error
				alert("There was an error: "+data.error_msg);
			}
			else{
				// store
				audio_url = data.audio_url;

				try {
					// load words from JSON url
			    const response = await fetch(data.words_url);
			    var words_json = await response.json();

			    // store words
			    words = words_json;

			    console.log("Words: ", words);
			  }
			  catch (error) {
			    console.error("Error loading words:", error);
			  }

				// load
				loadAudio();
			}
		}
	});
}

function loadAudio()
{
	$("#words").text("Loading audio...");

	// get mp3
	fetch(audio_url) 
	    .then(response => response.arrayBuffer())
	    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
	    .then(audioBuffer => {

	        audio.buffer = audioBuffer;
	        audio.duration = audioBuffer.duration;
	        audio.loaded = true;

	        if (playing == false) {
	        	startPlaying();
	        }
	    })
	    .catch(e => console.log('Error with decoding audio data:', e));
}

function startPlaying()
{
	playing = true;
	playVocal();
}

function stopPlaying()
{
	playing = false;
	stopVocal();
}

function playVocal() 
{
  if (audio.buffer)
  {
    audio.source = audioContext.createBufferSource();
    audio.source.buffer = audio.buffer;

    audio.source.connect(mixer);

    audio.source.start(audioContext.currentTime);

    audio.start_time = audioContext.currentTime;
  }
}

function stopVocal()
{
	try {
		audio.source.stop();
	}catch(e) {

	}
}




