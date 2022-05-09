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
	const user = await req.app.db.getUser(req.params.username);
	if (!user)
		return res.render('profile', {unknown: true});
	const tweets = await user.getTweets();
	const likes = await user.getLikes();
	// Convertis les potentiels retweets en tweets classiques avec un attribut retweeter
	// On n'effectue pas cette opération, l'application est faite de telle sorte que
	// Un tweet correspondant à un retweet ne peut être liké, le tweet original est liké à la place.
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
	// On n'oublie pas cependant de récupérer les auteurs des tweets aimés.
	for (const tweet of likes) {
		await tweet.fetchAuthor();
	}
	res.render('profile', {profile: user, tweets, likes});
});

module.exports = router;