require('dotenv').config(); // Populates process.env with values set in .env
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const Logger = require('./lib/misc/Logger');
const app = express();


// Middleware
app.use(cookieParser('secret'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require('./middleware/auth'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
// App variables
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.log = new Logger('App');
app.db = require('./lib/db/Database');
// Routes
app.use('/', require('./routes/index'));

app.db.connect().then(() => {
	app.log.info('Connected to database.');
	app.listen(process.env.PORT || 3000, () => app.log.info(`Listening on :${process.env.PORT || 3000}`));
});