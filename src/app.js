require('dotenv').config(); // Populates process.env with values set in .env
const express = require('express');
const path = require('path');
const Logger = require('./lib/misc/Logger');
const app = express();

app.log = new Logger('App');
app.db = require('./lib/db/Database');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.db.connect().then(() => {
	app.log.info('Connected to database.');
	app.listen(process.env.PORT || 3000, () => app.log.info(`Listening on :${process.env.PORT || 3000}`));
});