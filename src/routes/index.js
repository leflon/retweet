const {Router} = require('express');
const Account = require('../lib/db/Account');
const bcrypt = require('bcrypt');
const router = Router();

router.get('/', (req, res) => {
	res.redirect('/home');
});

router.get('/login', (req, res) => {
	res.render('login');
});

router.post('/login', async (req, res) => {
	const {username, password} = req.body;
	const [result] = await req.app.db.connection.query('SELECT * FROM account WHERE username = ?', [username]);
	if (result.length === 0) {
		return res.render('login', {
			error: 'Invalid username or password.',
		});
	}
	const user = new Account(result[0], req.app.db);
	if (!await bcrypt.compare(password, user.encryptedPassword)) {
		return res.render('login', {
			error: 'Invalid username or password.',
		});
	}
	const token = await user.generateToken(req.get('user-agent'), req.ip);
	res.cookie('auth', token, {signed: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'strict', secure: true});
	res.redirect('/home');
});

router.get('/logout', (req, res) => {
	req.app.db.connection.query('DELETE FROM auth WHERE token = ?', [req.signedCookies.auth]);
	res.clearCookie('auth');
	res.redirect('/login');
})

router.get('/home', (req, res) => {
	res.render('home', {username: req.user.username});
});

module.exports = router;