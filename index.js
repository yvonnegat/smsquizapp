require('dotenv').config();
console.log('[DEBUG] AT_USERNAME =', process.env.AT_USERNAME);
console.log('[DEBUG] AT_API_KEY starts with =', process.env.AT_API_KEY?.slice(0,10));
const express = require('express');
const bodyParser = require('body-parser');

const smsRoutes = require('./routes/sms');
const adminRoutes = require('./routes/admin');
const airtimeRoutes = require('./routes/airtime');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => res.send('Hello, SMS Quiz!'));
app.use('/sms', smsRoutes);
app.use('/admin', adminRoutes);
app.use('/airtime', airtimeRoutes);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
