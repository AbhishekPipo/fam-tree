const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { initDriver } = require('./src/config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');

const familyRoutes = require('./src/routes/familyRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);

app.get('/', (req, res) => {
  res.send('Family Tree API with Neo4j is running!');
});

const startServer = async () => {
  try {
    await initDriver();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
