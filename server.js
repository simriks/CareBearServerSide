const express = require('express');
const app = express();
const port = 8080;

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

app.get('/', (req, res) => {
  res.send(`Server running! Images received: ${imageCount}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});