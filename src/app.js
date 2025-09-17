const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Import your routers here
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

module.exports = app;
