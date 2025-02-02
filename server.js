// server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const QRCode = require('qr-image');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up storage for uploaded images
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API for generating card
app.post('/generate-card', upload.single('logo'), (req, res) => {
  const { textContent, colors } = req.body;
  const logoBuffer = req.file ? req.file.buffer : null;

  // Generate QR code
  const qrCodeBuffer = QRCode.imageSync(`https://example.com`, { type: 'png' });

  // Create the card image
  createBusinessCard(textContent, colors, logoBuffer, qrCodeBuffer)
    .then((imagePath) => res.json({ success: true, imagePath }))
    .catch(err => res.status(500).json({ success: false, error: err.message }));
});

// Helper function to create a business card image
async function createBusinessCard(textContent, colors, logoBuffer, qrCodeBuffer) {
  const cardWidth = 600;
  const cardHeight = 300;

  // Create blank image with background color
  let card = sharp({
    create: {
      width: cardWidth,
      height: cardHeight,
      channels: 4,
      background: colors.background || 'white'
    }
  });

  if (logoBuffer) {
    // Resize logo (example: 100x100)
    const logo = await sharp(logoBuffer).resize(100, 100).toBuffer();
    card = card.composite([{ input: logo, gravity: 'northwest', top: 20, left: 20 }]);
  }

  // Optionally add text and QR code
  card.png();
  const outputPath = path.join(__dirname, 'output', 'business_card.png');
  await card.toFile(outputPath);

  return outputPath;
}

// Export to PDF
app.get('/export-to-pdf', (req, res) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'output', 'business_card.pdf');

  res.setHeader('Content-disposition', `attachment; filename=business_card.pdf`);
  res.setHeader('Content-type', 'application/pdf');

  // Pipe PDF into the response
  doc.pipe(res);
  doc.text('Your Business Card', { align: 'center', fontSize: 24 });
  doc.image(path.join(__dirname, 'output', 'business_card.png'), {
    fit: [400, 300],
    align: 'center',
    valign: 'center'
  });
  doc.end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
