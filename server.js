const express = require('express');
const bodyParser = require('body-parser');
const qr = require('qr-image');
const { createCanvas, Image } = require('canvas'); // Ensure Image is imported from canvas
const jsPDF = require('jspdf');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

let cardDesigns = []; // In-memory storage for card designs

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to generate QR code
app.post('/generate-qr', (req, res) => {
    const { data } = req.body;
    const qrCode = qr.image(data, { type: 'png' });
    res.set('Content-Type', 'image/png');
    qrCode.pipe(res);
});

// Endpoint to save card design
app.post('/save-card', (req, res) => {
    const { design } = req.body;
    cardDesigns.push(design);
    res.json({ message: 'Card saved successfully!' });
});

// Endpoint to export card as PDF
app.post('/export-pdf', (req, res) => {
    const { design } = req.body;

    const pdf = new jsPDF();
    const canvas = createCanvas(300, 200); // Adjust size as needed
    const ctx = canvas.getContext('2d');

    // Draw background color
    ctx.fillStyle = design.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Name: ${design.name}`, 10, 30);
    ctx.fillText(`Phone: ${design.phone}`, 10, 60);
    ctx.fillText(`Job Title: ${design.jobTitle}`, 10, 90);
    ctx.fillText(`Company: ${design.company}`, 10, 120);
    ctx.fillText(`Email: ${design.email}`, 10, 150);
    ctx.fillText(`Social: ${design.social}`, 10, 180);

    // Create QR code
    const qrCode = qr.image(design.qrData, { type: 'png' });
    const qrStream = qrCode.pngStream();
    const qrBuffer = [];

    qrStream.on('data', chunk => qrBuffer.push(chunk));
    qrStream.on('end', () => {
        const qrImageData = Buffer.concat(qrBuffer);
        const qrImage = new Image();
        qrImage.src = qrImageData;

        // Wait for the image to load before adding it to the PDF
        qrImage.onload = () => {
            pdf.addImage(qrImage, 'PNG', 150, 30, 50, 50); // Adjust position and size
            pdf.save('card.pdf'); // Save PDF file
            res.json({ message: 'PDF exported successfully!' });
        };

        qrImage.onerror = (err) => {
            console.error('Error loading QR image:', err);
            res.status(500).json({ message: 'Error exporting PDF.' });
        };
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});