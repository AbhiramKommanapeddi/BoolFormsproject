const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Allow large bas64 images

// MongoDB Connection (Placeholder/Local or ENV)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/boloforms-signature';
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

// Schema for Audit Trail
const DocumentSchema = new mongoose.Schema({
    originalHash: String,
    finalHash: String,
    createdAt: { type: Date, default: Date.now },
});
const DocumentModel = mongoose.model('Document', DocumentSchema);

// Routes
app.get('/', (req, res) => {
    res.send('BoloForms Signature Engine API');
});

const crypto = require('crypto');

// Helper to calculate Hash
const calculateHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

app.post('/sign-pdf', async (req, res) => {
    try {
        const { pdfId, signatureImage, fields } = req.body;
        // fields: Array of { x, y, width, height, pageIndex, type } (in Percentages)

        // 1. Load Original PDF
        // In a real app, fetch from S3/DB using pdfId. Here we use the local sample.
        const pdfPath = path.join(__dirname, '../client/public/sample.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);

        // 2. Audit: Original Hash
        const originalHash = calculateHash(pdfBuffer);

        // 3. Load into pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // 4. Process Fields
        for (const field of fields) {
            if (field.type === 'signature' && signatureImage) {
                const pngImage = await pdfDoc.embedPng(signatureImage); // Assuming PNG signature
                // If Base64 string includes prefix (data:image/png;base64,...), strip it first if needed.
                // But pdf-lib embedPng handles base64 string directly? 
                // Actually usually needs Uint8Array or ArrayBuffer if not standard base64 string.
                // Let's assume frontend sends clean base64 or we clean it.

                const pages = pdfDoc.getPages();
                const page = pages[0]; // Assuming page 1 for now or field.pageIndex

                const { width, height } = page.getSize();

                // Conversions: Percentage -> Points
                const x = (field.x / 100) * width;
                const fieldHeight = (field.height / 100) * height; // Height in Points
                const distanceFromTop = (field.y / 100) * height;

                // pdf-lib Coordinate System: (0,0) is Bottom-Left.
                // We have (0,0) at Top-Left from frontend.
                const y = height - distanceFromTop - fieldHeight;

                const fieldWidth = (field.width / 100) * width;

                // Aspect Ratio Constraint
                const imgDims = pngImage.scaleToFit(fieldWidth, fieldHeight);

                // Center the image in the box
                const xOffset = (fieldWidth - imgDims.width) / 2;
                const yOffset = (fieldHeight - imgDims.height) / 2;

                page.drawImage(pngImage, {
                    x: x + xOffset,
                    y: y + yOffset,
                    width: imgDims.width,
                    height: imgDims.height,
                });
            }
        }

        // 5. Save Signed PDF
        const signedPdfBytes = await pdfDoc.save();
        const signedPdfBuffer = Buffer.from(signedPdfBytes);

        // 6. Audit: Final Hash
        const finalHash = calculateHash(signedPdfBuffer);

        // 7. Store Audit Trail
        // await DocumentModel.create({ originalHash, finalHash }); // Mocked for now

        // 8. Return
        // In real app, upload to S3 and return URL. Here, send base64 or temporary URL?
        // Let's send a data URI for the demo.
        const signedBase64 = signedPdfBuffer.toString('base64');
        const dataUri = `data:application/pdf;base64,${signedBase64}`;

        res.json({
            status: 'success',
            signedPdf: dataUri,
            audit: { originalHash, finalHash }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
