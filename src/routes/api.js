const {Router} = require('express');
const router = Router();

router.post('/tweets/add', async (req, res) => {
	const {content, author, repliesTo} = req.body;
	let parentTweet;
	if (req.user.id !== author)
		return res.status(403).send('You are not the author of this tweet.');
	if (content.length > 280)
		return res.status(400).send('Tweet is too long.');
	if (repliesTo) {
		parentTweet = await req.app.db.getTweet(repliesTo);
		if (!parentTweet)
			return res.status(400).send('This tweet replies to an unknown tweet.');
	}
	const tweet = await req.app.db.addTweet({content, authorId: author, repliesTo});
	if (parentTweet)
		parentTweet.addReply(tweet.id);
	if ('web' in req.query) // If the request comes from the web app, send the client back to the home page.
		return res.redirect(`/home`);
	res.status(200).send(tweet);
});

module.exports = router;