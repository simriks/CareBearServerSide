// Add at the top of server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Use environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Increased limits for faster processing
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static('.'));

// Store latest image with timestamp
let latestImageData = null;
let imageCount = 0;

// Optimized endpoint for continuous streaming
app.post('/frame', (req, res) => {
  try {
    const { image, timestamp } = req.body;
    
    if (image) {
      latestImageData = image;
      imageCount++;
      
      // Less verbose logging for continuous stream
      if (imageCount % 10 === 0) { // Log every 10th image
        console.log(`Images received: ${imageCount} - Latest: ${new Date(timestamp).toLocaleTimeString()}`);
      }
      
      // Quick response
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'No image data' });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optimized image serving
app.get('/frame', (req, res) => {
  if (latestImageData) {
    const base64Data = latestImageData.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');
    
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': imgBuffer.length
    });
    res.end(imgBuffer);
  } else {
    res.status(404).send('No image available');
  }
});

// Add this to your server.js
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, audioData, mimeType } = req.body;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: prompt ? [{ text: prompt }] : [
            { text: "Transcribe this audio to English text." },
            { inlineData: { mimeType, data: audioData } }
          ]
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(`Server running! Images received: ${imageCount}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
