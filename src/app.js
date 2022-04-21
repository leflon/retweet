require('dotenv').config(); // Populates process.env with values set in .env
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const Logger = require('./lib/misc/Logger');
const app = express();
const upload = multer({dest: './uploads'});

// Middleware
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require('./middleware/auth'));
app.use(require('./middleware/render'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/public', express.static(path.join(__dirname, '..', 'media')));
// App variables
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.log = new Logger('App');
app.db = require('./lib/db/Database');
// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/wall')); // Related to auth (login, register, recover password)
app.use('/api', require('./routes/api')); // Related to auth (login, register, recover password)

app.db.connect().then(() => {
	app.log.info('Connected to database.');
	app.listen(process.env.PORT || 3000, () => app.log.info(`Listening on :${process.env.PORT || 3000}`));

	app.db.getAccount('hickatheworld').then(account => {
		account.getTimeline();
	});

});