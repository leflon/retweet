const User = require('../lib/db/User');

module.exports = async function(req, res, next) {
	// Saute la vérification sur les routes qui ne la requièrent pas.
	if (req.path.startsWith('/public') ||
		req.path.startsWith('/register') ||
		req.path.startsWith('/renew-password') ||
		req.path.startsWith('/recover'))
		return next();

	// Redirige vers l'accueil si l'utilisateur est connecté.
	if (req.path === '/login' && req.signedCookies.auth)
		return res.redirect('/home');
	// Redirige vers la page de connexion si l'utilisateur n'est pas connecté.
	if (!req.signedCookies.auth && req.path !== '/login')
		return res.redirect('/login');
	// Si l'utilisateur n'est pas connecté, on le laisse accéder à la page de connexion.
	if (!req.signedCookies.auth && req.path === '/login')
		return next();

	const db = res.app.db;
	// Si le token envoyé par le navigateur n'est pas correct, on le supprime.
	const [result] = await db.connection.query('SELECT * FROM Auth WHERE token = ?', [req.signedCookies.auth]);
	if (result.length === 0) {
		res.clearCookie('auth');
		return res.redirect('/login');
	}
	let row = result[0];
	// En cas de différence l'user-agent et l'adresse IP reliés au token, on le supprime.
	// Cela pourrait être un vol de token de connexion.
	if (req.get('user-agent') !== row.user_agent && req.ip !== row.ip_address) {
		res.clearCookie('auth');
		await db.connection.query('DELETE FROM auth WHERE token = ?', [req.signedCookies.auth]);
		return res.redirect('/login');
	}
	// L'utilisateur étant bien connecté, on ajoute ses informations à la requête.
	[row] = await db.connection.query('SELECT * FROM User WHERE id = ?', [row.user_id]);
	const user = new User(row[0], db);
	req.user = user;
	next();
};