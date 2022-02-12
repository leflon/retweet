const {Router} = require('express');
const Account = require('../lib/db/Account');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');

const OAuth2 = google.auth.OAuth2;
const router = Router();

const createTransporter = async () => {
	const oauth2Client = new OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
		'https://developers.google.com/oauthplayground'
	);

	oauth2Client.setCredentials({
		refresh_token: process.env.REFRESH_TOKEN
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken((err, token) => {
			if (err) {
				reject();
			}
			resolve(token);
		});
	});

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: process.env.EMAIL,
			accessToken,
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			refreshToken: process.env.REFRESH_TOKEN
		}
	});

	return transporter;
};

router.get('/', (req, res) => {
	res.redirect('/home');
});

router.get('/login', (req, res) => {
	res.render('login', {mode: 'login'});
});

router.get('/register', (req, res) => {
	res.render('login', {mode: 'register'});
});

router.get('/recover', (req, res) => {
	res.render('login', {mode: 'recover'});
});

router.post('/login', async (req, res) => {
	const {username, password} = req.body;
	const [result] = await req.app.db.connection.query('SELECT * FROM account WHERE username = ?', [username]);
	if (result.length === 0) {
		return res.render('login', {
			error: true,
			mode: 'login'
		});
	}
	const user = new Account(result[0], req.app.db);
	if (!await bcrypt.compare(password, user.encryptedPassword)) {
		return res.render('login', {
			error: true,
			mode: 'login'
		});
	}
	const token = await user.generateToken('auth', req.get('user-agent'), req.ip);
	res.cookie('auth', token, {signed: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'strict', secure: true});
	res.redirect('/home');
});

router.post('/recover', async (req, res) => {
	const {email} = req.body;
	const [result] = await req.app.db.connection.query('SELECT * FROM account WHERE email = ?', [email]);
	if (result.length === 0) {
		return res.render('login', {
			error: 'Aucun compte ne correspond à cette adresse email.',
			mode: 'recover'
		});
	}
	const user = new Account(result[0], req.app.db);
	const token = await user.generateToken('recover');
	const transporter = await createTransporter();
	const mailOptions = {
		from: `Retweet <${process.env.GMAIL_ADDRESS}>`,
		to: email,
		subject: `[${user.username}] Récupération de mot de passe`,
		html: `
			<h1>Récupération de votre mot de passe</h1>
			<p>Vous avez demandé la récupération de votre mot de passe. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
			<p>Pour récupérer votre mot de passe, cliquez sur le lien ci-dessous.</p>
			<p><a href='${process.env.APP_URL}/recover?ut=${token}'>Récupérer mon mot de passe</a></p>
		`
	};
	transporter.sendMail(mailOptions, (err, info) => {
		console.log(err);
		if (err) {
			return res.render('login', {
				error: 'Une erreur est survenue lors de l\'envoi de l\'email de récupération de mot de passe.',
				mode: 'recover'
			});
		}
		res.render('login', {
			mode: 'recover-confirm'
		});
	});
});

router.post('/register', async (req, res) => {
	const {username, password, email} = req.body;
	let [row] = await req.app.db.connection.query('SELECT * FROM Account WHERE username = ?', [username]);
	if (row.length !== 0)
		return res.render('login', {mode: 'register', error: 'Nom d\'utilisateur déjà existant.'});

	[row] = await req.app.db.connection.query('SELECT * FROM Account WHERE email = ?', [email]);
	if (row.length !== 0)
		return res.render('login', {mode: 'register', error: 'Adresse e-mail déjà utilisée.'});
	const user = await res.app.db.addAccount({
		username,
		password,
		email
	});
	res.user = user;
	const token = await user.generateToken('auth', req.get('user-agent'), req.ip);
	res.cookie('auth', token, {signed: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'strict', secure: true});
	res.redirect('/home?welcome');
});

router.get('/logout', (req, res) => {
	req.app.db.connection.query('DELETE FROM auth WHERE token = ?', [req.signedCookies.auth]);
	res.clearCookie('auth');
	res.redirect('/login');
});

router.get('/home', (req, res) => {
	res.render('home', {username: req.user.username});
});

module.exports = router;