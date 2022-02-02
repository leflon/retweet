require('dotenv').config(); // Populates process.env with values set in .env
const express = require('express');
const Logger = require('./lib/misc/Logger');
const app = express();

app.use('view engine', 'pug');
app.use('views', './views');
app.use('/public', express.static('../public'));

app.listen(process.env.PORT || 3000, () => {
	new Logger('App').info('Server started');
});