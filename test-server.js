const express = require('express');
require('dotenv').config();

console.log('Starting test server...');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Test endpoint: http://localhost:${PORT}/test`);
});
