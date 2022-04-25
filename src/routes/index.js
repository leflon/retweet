const {Router} = require('express');
const router = Router();

/* GET */

router.get('/', (req, res) => {
	res.redirect('/home');
});
router.get('/home', async (req, res) => {
	const tweets = await req.user.getTimeline();
	for (const i in tweets) {
		const tweet = tweets[i];
		await tweet.fetchAuthor();
		if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
			const original = await req.app.db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
			if (original) {
				original.retweeter = tweet.author;
				await original.fetchAuthor();
				tweets[i] = original;
			}
		}
	}
	res.render('home', {tweets});
});

router.get('/profile/:username', async (req, res) => {
	const user = await req.app.db.getAccount(req.params.username);
	if (!user)
		return res.render('profile', {unknown: true});
	const tweets = await user.getTweets();
	for (const i in tweets) {
		const tweet = tweets[i];
		await tweet.fetchAuthor();
		if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
			const original = await req.app.db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
			if (original) {
				original.retweeter = tweet.author;
				await original.fetchAuthor();
				tweets[i] = original;
			}
		}
	}
	res.render('profile', {profile: user, tweets});
});

module.exports = router;