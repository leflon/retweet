const Account = require('../lib/db/Account');

module.exports = async function(req, res, next) {
	if (req.path.startsWith('/public') ||
		req.path.startsWith('/register') ||
		req.path.startsWith('/renew-password') ||
		req.path.startsWith('/recover'))
		return next();

	if (req.path === '/login' && req.signedCookies.auth)
		return res.redirect('/home');
	if (!req.signedCookies.auth && req.path !== '/login')
		return res.redirect('/login');
	if (!req.signedCookies.auth && req.path === '/login')
		return next();

	const db = res.app.db;
	const [result] = await db.connection.query('SELECT * FROM auth WHERE token = ?', [req.signedCookies.auth]);
	if (result.length === 0) {
		res.clearCookie('auth');
		return res.redirect('/login');
	}
	let row = result[0];
	if (req.get('user-agent') !== row.user_agent && req.ip !== row.ip_address) {
		res.clearCookie('auth');
		await db.connection.query('DELETE FROM auth WHERE token = ?', [req.signedCookies.auth]);
		return res.redirect('/login');
	}
	[row] = await db.connection.query('SELECT * FROM account WHERE id = ?', [row.user_id]);
	const user = new Account(row[0], db);
	req.user = user;
	next();
};