const {Router} = require('express');
const {join} = require('path');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

const router = Router();

router.post('/tweets/add', upload.single('media'), async (req, res) => {
	const {content, repliesTo} = req.body;
	let parentTweet;
	if (content.length > 280)
		return res.status(400).send({message: 'Tweet is too long.'});
	if (repliesTo) {
		parentTweet = await req.app.db.getTweet(repliesTo);
		if (!parentTweet)
			return res.status(400).send({message: 'This tweet replies to an unknown tweet.'});
	}
	let id;
	let mediaId;
	if (req.file) {
		id = await req.app.db.generateId();
		mediaId = await req.app.db.addMedia(join(__dirname, '../../', req.file.path), {
			id,
			type: 'tweet'
		});
	}
	const tweet = await req.app.db.addTweet({content, authorId: req.user.id, repliesTo, id, mediaId});
	if (parentTweet)
		parentTweet.addReply(tweet.id);
	return res.redirect(`/home`);
});

router.get('/tweets/like/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (tweet.likes.includes(req.user.id))
		return res.status(400).send({message: 'You have already liked this tweet.'});
	await tweet.addLike(req.user.id);
	return res.status(200).send({likes: tweet.likes.length});
});

router.get('/tweets/unlike/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (!tweet.likes.includes(req.user.id))
		return res.status(400).send({message: 'You have not already liked this tweet.'});
	tweet.removeLike(req.user.id);
	return res.status(200).send({likes: tweet.likes.length});
});

router.get('/tweets/retweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (tweet.retweets.includes(req.user.id))
		return res.status(400).send({message: 'You have already retweeted this tweet.'});

	await req.app.db.addTweet({
		content: `//RT:${tweet.id}`,
		authorId: req.user.id
	});
	await tweet.addRetweet(req.user.id);
	return res.status(200).send({retweets: tweet.retweets.length});
});

router.get('/tweets/unretweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (!tweet.retweets.includes(req.user.id))
		return res.status(400).send({message: 'You have not already retweeted this tweet.'});

	const [[{id}]] = await req.app.db.connection.query('SELECT id FROM Tweet WHERE content LIKE ? AND author_id = ?', [`%//RT:${req.params.id}%`, req.user.id]);
	res.redirect(`/api/tweets/delete/${id}?unretweet`);
});

router.get('/tweets/delete/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (tweet.authorId !== req.user.id && !req.user.isAdmin)
		return res.status(403).send('You don\'t have the permission to delete this tweet.');
	if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
		const original = await req.app.db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
		await original?.removeRetweet(req.user.id);
		if ('unretweet' in req.query) {
			await tweet.delete();
			return res.send({retweets: original.retweets.length});
		}
	}
	if (tweet.retweets.length)
		req.app.db.connection.query('UPDATE Tweet SET is_deleted = 1 WHERE content LIKE ?', [`%//RT:${tweet.id}%`]);

	await tweet.delete();
	return res.send({deleted: true});
});

module.exports = router;