const {Router} = require('express');
const {join} = require('path');
const multer = require('multer');
const res = require('express/lib/response');
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
	return res.status(200).send({count: tweet.likes.length});
});

router.get('/tweets/unlike/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (!tweet.likes.includes(req.user.id))
		return res.status(400).send({message: 'You have not already liked this tweet.'});
	tweet.removeLike(req.user.id);
	return res.status(200).send({count: tweet.likes.length});
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
	return res.status(200).send({count: tweet.retweets.length});
});

router.get('/tweets/unretweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'This tweet does not exist.'});
	if (!tweet.retweets.includes(req.user.id))
		return res.status(400).send({message: 'You have not already retweeted this tweet.'});

	const [[{id}]] = await req.app.db.connection.query('SELECT id FROM Tweet WHERE content LIKE ? AND author_id = ? AND is_deleted = 0', [`%//RT:${req.params.id}%`, req.user.id]);
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
			return res.send({count: original.retweets.length});
		}
	}
	if (tweet.retweets.length)
		req.app.db.connection.query('UPDATE Tweet SET is_deleted = 1 WHERE content LIKE ?', [`%//RT:${tweet.id}%`]);

	await tweet.delete();
	return res.send({deleted: true});
});

router.post('/profile/edit/:id', upload.fields([{name: 'avatar'}, {name: 'banner'}]), async (req, res) => {
	const {name, bio, location, website} = req.body;
	const user = await req.app.db.getAccountById(req.params.id);
	if (!user)
		return res.status(400).send({message: 'This user does not exist.'});
	if (user.id !== req.user.id && !req.user.isAdmin)
		return res.status(403).send('You don\'t have the permission to edit this user.');
	if (name.length > 50)
		return res.status(400).send({message: 'Name is too long.'});
	if (bio.length > 160)
		return res.status(400).send({message: 'Bio is too long.'});
	if (location.length > 30)
		return res.status(400).send({message: 'Location is too long.'});
	if (website.length > 100)
		return res.status(400).send({message: 'Website is too long.'});
	if (req.files.avatar) {
		const avatarId = await req.app.db.addMedia(join(__dirname, '../../', req.files.avatar[0].path), {
			id: await req.app.db.generateId(),
			type: 'avatar'
		});
		user.avatarId = avatarId;
	}
	if (req.files.banner) {
		const bannerId = await req.app.db.addMedia(join(__dirname, '../../', req.files.banner[0].path), {
			id: await req.app.db.generateId(),
			type: 'banner'
		});
		user.bannerId = bannerId;
	}
	user.displayName = name;
	user.bio = bio;
	user.location = location;
	user.website = website;
	await user.save();
	return res.redirect(`/profile/${user.username}`);
});

router.get('/follow/:id', async (req, res) => {
	const user = await req.app.db.getAccountById(req.params.id);
	if (!user)
		return res.status(400).send({message: 'This user does not exist.'});
	if (user.id === req.user.id)
		return res.status(400).send({message: 'You cannot follow yourself.'});
	if (user.followers.includes(req.user.id))
		return res.status(400).send({message: 'You already follow this user.'});
	user.followers.push(req.user.id);
	req.user.follows.push(user.id);
	await user.save();
	await req.user.save();
	return res.send({followed: true});
});

router.get('/unfollow/:id', async (req, res) => {
	console.log(req.params.id);
	const user = await req.app.db.getAccountById(req.params.id);
	if (!user)
		return res.status(400).send({message: 'This user does not exist.'});
	if (user.id === req.user.id)
		return res.status(400).send({message: 'You cannot unfollow yourself.'});
	if (!user.followers.includes(req.user.id))
		return res.status(400).send({message: 'You don\'t follow this user.'});
	user.followers = user.followers.filter(id => id !== req.user.id);
	req.user.follows = req.user.follows.filter( id => id !== user.id);
	await user.save();
	await req.user.save();
	return res.send({unfollowed: true});
});

module.exports = router;