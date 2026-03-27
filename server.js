const express = require('express');
const cors = require('cors');
const { hunt } = require('./rtp-hunter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/hunt', (req, res) => {
    // Implement your hunting logic here
    const result = hunt(); // Call the hunt function from rtp-hunter.js
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});