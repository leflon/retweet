const {Router} = require('express');
const {formatTweetList} = require('../lib/misc/TweetUtils');
const User = require('../lib/db/User');
const router = Router();


/**
 * GET /
 * Redirige vers la page d'accueil.
 */
router.get('/', (req, res) => {
	res.redirect('/home');
});

/**
 * GET /home
 * Affiche la page d'accueil.
 */
router.get('/home', async (req, res) => {
	const tweets = await req.user.getTimeline();
	res.render('home', {tweets});
});

/**
 * GET /all
 * Redirige vers /everything.
 */
router.get('/all', async (req, res) => {
	res.redirect('/everything');
});

/**
 * GET /everything
 * Affiche tous les tweets.
 */
router.get('/everything', async (req, res) => {
	const tweets = await req.app.db.getAllTweets(req.user.isAdmin);
	res.render('home', {tweets, everything: true});
});

router.get('/tweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet || (tweet.isDeleted && !req.user.isAdmin)) {
		return res.status(404).send('Tweet not found.');
	}
	await tweet.fetchAuthor();
	await tweet.fetchRepliesCount();
	let origins = [];
	let current = tweet;
	while (current?.repliesTo) {
		const origin = await req.app.db.getTweet(current.repliesTo);
		if (origin) {
			if (origin.isDeleted && !req.user.isAdmin)
				origins.push({notFound: true});
			else {
				await origin.fetchAuthor();
				await origin.fetchRepliesCount();
				origins.push(origin);
			}
		}
		current = origin;
		// Si le tweet d'origine n'est pas trouvé
		// La boucle s'arrêtera car current?.repliesTo est undefined.
	}
	// On reverse afin d'avoir la plus ancienne référence en premier.
	// On pourra donc afficher du plus vieux tweet jusqu'au tweet actuel
	origins = origins.reverse();

	const replies = [];
	for (const id of tweet.replies) {
		const reply = await req.app.db.getTweet(id);
		if (reply && (!reply.isDeleted || req.user.isAdmin)) {
			await reply.fetchAuthor();
			await reply.fetchRepliesCount();
			replies.push(reply);
		}
	}
	res.render('tweet-view', {tweet, origins, replies});
});

/**
 * GET /profile/:username
 * Affiche le profil d'un utilisateur.
 * :username - Nom d'utilisateur de du profil à afficher.
 */
router.get('/profile/:username', async (req, res) => {
	const username = req.params.username;
	const user = await req.app.db.getUser(username);
	if (!user)
		return res.render('profile', {unknown: true, username});
	if (user.isDeleted && !req.user.isAdmin)
		return res.render('profile', {deleted: true, username});
	if (user.isSuspended && !req.user.isAdmin)
		return res.render('profile', {suspended: true, username});
	const tweets = await user.getTweets();
	const likes = await user.getLikes();
	// On formatte les retweets comme dans /home.
	// Cela n'est pas nécessaire pour les likes, car il est impossible d'aimer un retweet.
	// Aimer un tweet retweeté revient à aimer le tweet original.
	for (const i in tweets) {
		const tweet = tweets[i];
		await tweet.fetchAuthor();
		await tweet.fetchRepliesCount();
		if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
			const original = await req.app.db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
			if (original) {
				original.retweeter = tweet.author;
				await original.fetchAuthor();
				tweets[i] = original;
			}
		}
	}
	// On n'oublie pas cependant de récupérer les auteurs des tweets aimés
	// Ainsi que leurs nombres de réponses.
	for (const tweet of likes) {
		await tweet.fetchRepliesCount();
		await tweet.fetchAuthor();
	}
	res.render('profile', {profile: user, tweets, likes});
});

router.get('/search', async (req, res) => {
	if (!req.query.q || !req.query.q.trim())
		return res.render('search', {welcome: true});
	let query = '%' + req.query.q + '%';
	const [tweets] = await req.app.db.connection.query('SELECT * FROM Tweet WHERE content LIKE ? ORDER BY JSON_LENGTH(retweets) DESC, JSON_LENGTH(likes) DESC', [query]);
	const [users] = await req.app.db.connection.query('SELECT * FROM User WHERE username LIKE ? OR display_name LIKE ?', [query, query]);
	const formattedTweets = await formatTweetList(tweets, req.app.db);
	const formattedUsers = users.map(u => new User(u));
	console.log(formattedTweets, formattedUsers);
	res.render('search', {tweets: formattedTweets, users: formattedUsers, query: req.query.q});

});

module.exports = router;