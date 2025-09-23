require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const smsRoutes = require('./routes/sms');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => res.send('Hello, SMS Quiz!'));
app.use('/sms', smsRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
