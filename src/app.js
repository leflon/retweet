require('dotenv').config(); // Attache les valeurs du .env à process.env
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const Logger = require('./lib/misc/Logger');
const app = express();
const upload = multer({dest: './uploads'});
const webpushConfig = require('./web-push');
const webpush = require('web-push');

// Middleware
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require('./middleware/auth'));
app.use(require('./middleware/render'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/public', express.static(path.join(__dirname, '..', 'media')));
// Variables de l'app
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.log = new Logger('App');
app.db = require('./lib/db/Database');
// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/wall'));
app.use('/api', require('./routes/api'));
app.get('/sw.js', (req, res) => {
	res.sendFile('./sw.js', {root: path.join(__dirname)});
});
webpushConfig();

app.db.connect().then(() => {
	app.log.info('Connecté à la base de données.');
	app.listen(process.env.PORT || 3000, () => app.log.info(`Serveur á l'écoute sur le port :${process.env.PORT || 3000}`));
});