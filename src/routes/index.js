const {Router} = require('express');
const router = Router();

/* GET */

router.get('/', (req, res) => {
	res.redirect('/home');
});
router.get('/home', async (req, res) => {
	const timeline = await req.user.getTimeline();
	for (const tweet of timeline) {
		await tweet.fetchAuthor();
	}
	res.render('home', {tweets: timeline});
});

module.exports = router;