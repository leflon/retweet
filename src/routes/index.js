const {Router} = require('express');
const router = Router();

/* GET */

router.get('/', (req, res) => {
	res.redirect('/home');
});
router.get('/home', (req, res) => {
	res.render('home', {username: req.user.username});
});

module.exports = router;