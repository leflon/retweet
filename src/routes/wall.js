const {Router} = require('express');
const User = require('../lib/db/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');

const OAuth2 = google.auth.OAuth2;
const router = Router();

/**
 * Crée les outils nécessaires pour envoyer un e-mail via Gmail.
 */
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

const MAIL_HTML_TEMPLATE = `
<h1 style='text-align: center;'>Retweet</h1>
<h2>Récupération de votre mot de passe</h2>
<p>Vous avez demandé la récupération de votre mot de passe. <i style='color: gray;'>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</i></p>
<p style='font-weight: bold;text-align: center;'>Pour récupérer votre mot de passe, cliquez sur le lien ci-dessous.</p>
<p style='text-align: center;font-size: 22pt; margin: 0 0'><a href='{{BASE_URL}}/recover?ut={{TOKEN}}'>Récupérer mon mot de passe</a></p>
`;

// Le "mur" est la page affichée à tout utilisateur qui n'est pas connecté.
// L'application n'est pas accessible sans compte.

/**
 * GET /login
 * Affiche le "mur" en mode connexion.
 */
router.get('/login', (req, res) => {
	res.render('wall', {mode: 'login'});
});

/**
 * GET /register
 * Affiche le "mur" en mode inscription.
 */
router.get('/register', (req, res) => {
	res.render('wall', {mode: 'register'});
});

/**
 * GET /recover
 * Affiche le "mur" en mode récupération de mot de passe.
 * En prenant en compte les différentes étapes.
 */
router.get('/recover', async (req, res) => {
	// ut: token de récupération de mot de passe.
	const {ut} = req.query;
	if (ut) {
		let [row] = await req.app.db.connection.query('SELECT * FROM Recover WHERE token = ?', [ut]);
		if (row.length === 0)
			return res.render('wall', {mode: 'recover-step2', error: 'Ce lien de récupération est invalide.'});
		// Un token de récupération de mot de passe n'est valide que 5 minutes.
		const at = row[0].created_at;
		const diff = Math.floor((Date.now() - at) / 1000);
		if (diff > 300)
			return res.render('wall', {mode: 'recover-step2', error: 'Ce lien de récupération a expiré. Veuillez en demander un nouveau.'});
		// En cas de token valide, on affiche le formulaire de changement de mot de passe.
		return res.render('wall', {mode: 'recover-step2', token: ut});
	}
	// Si aucun ut n'est fourni, on affiche la première étape de récupération (renseignement de l'e-mail lié au compte).
	res.render('wall', {mode: 'recover'});
});

/**
 * GET /logout
 * Déconnecte l'utilisateur et le redirige vers la page de connexion.
 */
router.get('/logout', (req, res) => {
	req.app.db.connection.query('DELETE FROM auth WHERE token = ?', [req.signedCookies.auth]);
	res.clearCookie('auth');
	res.redirect('/login');
});

/**
 * POST /login
 * Vérifie les identifiants de l'utilisateur tentant de se connecter.
 */
router.post('/login', async (req, res) => {
	const {username, password} = req.body;
	const [result] = await req.app.db.connection.query('SELECT * FROM User WHERE username = ?', [username]);
	// Nom d'utilisateur invalide.
	if (result.length === 0) {
		return res.render('wall', {
			error: true,
			mode: 'login'
		});
	}
	const user = new User(result[0], req.app.db);
	// Mot de passe invalide.
	if (!await bcrypt.compare(password, user.encryptedPassword)) {
		return res.render('wall', {
			error: true,
			mode: 'login'
		});
	}
	// En cas d'identifiants corrects, on génère le token d'authentification et on le stocke dans la base de données et en cookie.
	// Cela gardera le compte connecté tant que l'user-agent et l'adresse ip correspondent.
	const token = await user.generateToken('Auth', req.get('user-agent'), req.ip);
	res.cookie('auth', token, {signed: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'strict', secure: true});
	res.redirect('/home');
});

/**
 * POST /recover
 * Envoie un e-mail de récupération de mot de passe.
 */
router.post('/recover', async (req, res) => {
	const {email} = req.body;
	const [result] = await req.app.db.connection.query('SELECT * FROM User WHERE email = ?', [email]);
	if (result.length === 0) {
		return res.render('wall', {
			error: 'Aucun compte ne correspond à cette adresse email.',
			mode: 'recover'
		});
	}
	const user = new User(result[0], req.app.db);
	// Envoi du token par e-mail.
	const token = await user.generateToken('Recover');
	const transporter = await createTransporter();
	const mailOptions = {
		from: `Retweet <${process.env.GMAIL_ADDRESS}>`,
		to: email,
		subject: `[${user.username}] Récupération de mot de passe`,
		html: MAIL_HTML_TEMPLATE.replace('{{BASE_URL}}', process.env.APP_URL).replace('{{TOKEN}}', token)
	};
	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			return res.render('wall', {
				error: 'Une erreur est survenue lors de l\'envoi de l\'email de récupération de mot de passe.',
				mode: 'recover'
			});
		}
		res.render('wall', {
			mode: 'recover-confirm'
		});
	});
});

/**
 * POST /renew-password
 * Change le mot de passe de l'utilisateur.
 */
router.post('/renew-password', async (req, res) => {
	const {ut} = req.query;
	const {password} = req.body;
	const [row] = await req.app.db.connection.query('SELECT * FROM Recover WHERE token = ?', [ut]);
	if (row.length === 0)
		return res.render('wall', {mode: 'recover-step2', error: 'Ce lien de récupération est invalide.'});
	const at = row[0].created_at;
	const diff = Math.floor((Date.now() - at) / 1000);
	if (diff > 300)
		return res.render('wall', {mode: 'recover-step2', error: 'Ce lien de récupération a expiré. Veuillez en demander un nouveau.'});
	const user = await req.app.db.getUserById(row[0].user_id);
	await user.updatePassword(password);
	await req.app.db.connection.query('DELETE FROM recover WHERE token = ?', [ut]);
	// Le paramètre newpd permet d'afficher un message de confirmation.
	res.redirect('/login?newpwd');
});

/**
 * POST /register
 * Enregistre un nouvel utilisateur.
 */
router.post('/register', async (req, res) => {
	const {username, password, email} = req.body;
	let [row] = await req.app.db.connection.query('SELECT * FROM User WHERE username = ?', [username]);
	if (row.length !== 0)
		return res.render('wall', {mode: 'register', error: 'Nom d\'utilisateur déjà existant.'});

	[row] = await req.app.db.connection.query('SELECT * FROM User WHERE email = ?', [email]);
	if (row.length !== 0)
		return res.render('wall', {mode: 'register', error: 'Adresse e-mail déjà utilisée.'});
	const user = await res.app.db.addUser({
		username,
		password,
		email
	});
	// Le compte étant crée avec succès, on génère le token d'authentification et on le stocke dans la base de données et en cookie.
	res.user = user;
	const token = await user.generateToken('Auth', req.get('user-agent'), req.ip);
	res.cookie('auth', token, {signed: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'strict', secure: true});
	// Le paramètre welcome permet d'afficher un message de confirmation.
	res.redirect('/home?welcome');
});

module.exports = router;