const {Router} = require('express');
const {join} = require('path');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

const router = Router();

/*
 * POST /api/tweets/add
 * Envoie un tweet.
 */
router.post('/tweets/add', upload.single('image'), async (req, res) => {
	const {content, repliesTo} = req.body;
	let parentTweet;
	let repliesToUsername;
	if (content.length > 280)
		return res.status(400).send({message: 'Contenu trop long.'});
	if (repliesTo) {
		parentTweet = await req.app.db.getTweet(repliesTo);
		if (!parentTweet)
			return res.status(400).send({message: 'Ce tweet répond à un tweet inexistant.'});
		// On récupère le nom d'utilisateur de l'auteur du tweet auquel on répond ici.
		[[{username: repliesToUsername}]] = await req.app.db.connection.query('SELECT username FROM user WHERE id = ?', [parentTweet.authorId]); 
	}
	// Si le tweet a une image, on doit générer son id manuellement.
	// L'Image en base de données nécessite l'id du tweet auquel elle est associée
	// et le tweet requiert l'id de l'image.
	// On doit donc générer l'id du tweet afin de créer l'image, et ensuite créer le tweet
	// avec cet id et l'id de l'image alors sauvegardée.
	// On ne peut pas le faire dans l'ordre inverse, car celà rendrait le tweet publique avant l'image qu'il est censé afficher.
	let id;
	let imageId;
	if (req.file) {
		id = await req.app.db.generateId();
		imageId = await req.app.db.addImage(join(__dirname, '../../', req.file.path), {
			id,
			type: 'tweet'
		});
	}
	const tweet = await req.app.db.addTweet({content, authorId: req.user.id, repliesTo, repliesToUsername, id, imageId});
	if (parentTweet) {
		parentTweet.replies.push(tweet.id);
		await parentTweet.save();
	}
	return res.redirect(`/home`);
});

/**
 * GET /api/tweets/like/:id
 * Aime un tweet.
 * :id - Id du tweet à aimer.
 */
router.get('/tweets/like/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'Ce tweet n\'existe pas.'});
	if (tweet.likes.includes(req.user.id))
		return res.status(400).send({message: 'Vous aimez déjà ce tweet.'});
	// On ajoute un utilisateur aimant au tweet, et un tweet aimé à l'auteur de la requête.
	tweet.likes.push(req.user.id);
	req.user.likes.push(tweet.id);
	await req.user.save();
	await tweet.save();
	return res.status(200).send({count: tweet.likes.length});
});

/**
 * GET /api/tweets/unlike/:id
 * Retire un J'aime à un tweet.
 * :id - Id du tweet dont on retire le J'aime.
 */
router.get('/tweets/unlike/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'Ce tweet n\'existe pas.'});
	if (!tweet.likes.includes(req.user.id))
		return res.status(400).send({message: 'Vous n\'aimez pas ce tweet.'});
	// Même procédé que pour /api/tweets/like/:id.
	tweet.likes = tweet.likes.filter(id => id !== req.user.id);
	req.user.likes = req.user.likes.filter(id => id !== tweet.id);
	await req.user.save();
	await tweet.save();
	return res.status(200).send({count: tweet.likes.length});
});

/**
 * GET /api/tweets/retweet/:id
 * Retweet un tweet.
 * :id - Id du tweet à retweeter.
 */
router.get('/tweets/retweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'Ce tweet n\'existe pas.'});
	if (tweet.retweets.includes(req.user.id))
		return res.status(400).send({message: 'Vous avez déjà retweeté ce tweet.'});

	await req.app.db.addTweet({
		content: `//RT:${tweet.id}`,
		authorId: req.user.id
	});
	tweet.retweets.push(req.user.id);
	await tweet.save();
	return res.status(200).send({count: tweet.retweets.length});
});

/**
 * GET /api/tweets/unretweet/:id
 * Retire un retweet à un tweet.
 * :id - Id du tweet dont on retire le retweet.
 */
router.get('/tweets/unretweet/:id', async (req, res) => {
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'Ce tweet n\'existe pas.'});
	if (!tweet.retweets.includes(req.user.id))
		return res.status(400).send({message: 'Vous n\'avez pas retweeté ce tweet.'});

	// Un retweet est un tweet contenant l'id du tweet à retweeter. (//RT:)
	// Dans le client, il est directement affiché comme le tweet retweeté.
	// Il s'agit donc de supprimer le "retweet" envoyé par l'auteur de la requête.
	// On cherche donc son id. Un utilisateur ne pouvant retweeter un tweet qu'une seule fois.
	const [[{id}]] = await req.app.db.connection.query('SELECT id FROM Tweet WHERE content LIKE ? AND author_id = ? AND is_deleted = 0', [`%//RT:${req.params.id}%`, req.user.id]);
	// On redirige alors vers la route de suppression de tweet avec l'id du retweet à supprimer.
	// Le paramètre unretweet est utilisé pour demander une réponse spéciale à la suppression d'un retweet
	// par rapport à la suppression d'un tweet simple.
	res.redirect(`/api/tweets/delete/${id}?unretweet`);
});

router.get('/tweets/delete/:id', async (req, res) => {
	console.log(req.params.id, 'wesh');
	const tweet = await req.app.db.getTweet(req.params.id);
	if (!tweet)
		return res.status(400).send({message: 'Ce tweet n\'existe pas.'});
	console.log(req.params.id, 'wesh2');
	if (tweet.authorId !== req.user.id && !req.user.isAdmin)
		return res.status(403).send('Vous n\'avez pas la permission de supprimer ce tweet.');
	console.log(req.params.id, 'wesh3');
	// Si le contenu du tweet correspond au format d'un retweet, on effectue les actions nécessaires.
	if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
		const original = await req.app.db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
		// On retire un retweet à l'original.
		if (original) {
			original.retweets = original.retweets.filter(id => id !== tweet.authorId);
			await original.save();
		}
		// Si c'est demandé, on renvoie le nouveau nombre de retweets de l'original.
		if ('unretweet' in req.query) {
			await tweet.delete();
			return res.send({count: original.retweets.length});
		}
	}
	console.log(req.params.id, 'wesh4');
	// Si ce tweet a été retweeté, on supprime tous les tweets retweetant ce tweet.
	if (tweet.retweets.length)
		req.app.db.connection.query('UPDATE Tweet SET is_deleted = 1 WHERE content LIKE ?', [`%//RT:${tweet.id}%`]);
	await tweet.delete();
	return res.send({deleted: true});
});

/**
 * POST /api/profile/edit/:id
 * Edite le profil d'un utilisateur.
 * :id - Id de l'utilisateur à éditer.
 */
router.post('/profile/edit/:id', upload.fields([{name: 'avatar'}, {name: 'banner'}]), async (req, res) => {
	const {name, bio, location, website} = req.body;
	const user = await req.app.db.getUserById(req.params.id);
	if (!user)
	return res.status(400).send({message: 'Cet utilisateur n\'existe pas.'});
	// Vérifications de longueur de tous les champs textuels du profil.
	if (user.id !== req.user.id && !req.user.isAdmin)
		return res.status(403).send('Vous n\'avez pas la permission de modifier cet utilisateur.');
	if (name.length > 50)
		return res.status(400).send({message: 'Nom trop long.'});
	if (bio.length > 160)
		return res.status(400).send({message: 'Bio trop longue.'});
	if (location.length > 30)
		return res.status(400).send({message: 'Localisation trop longue.'});
	if (website.length > 100)
		return res.status(400).send({message: 'Site internet trop long.'});
	if (req.files.avatar) {
		const avatarId = await req.app.db.addImage(join(__dirname, '../../', req.files.avatar[0].path), {
			id: await req.app.db.generateId(),
			type: 'avatar'
		});
		user.avatarId = avatarId;
	}
	if (req.files.banner) {
		const bannerId = await req.app.db.addImage(join(__dirname, '../../', req.files.banner[0].path), {
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

/**
 * GET /api/follow/:id
 * Suit un utilisateur.
 * :id - Id de l'utilisateur à suivre.
 */
router.get('/follow/:id', async (req, res) => {
	const user = await req.app.db.getUserById(req.params.id);
	if (!user)
		return res.status(400).send({message: 'Cet utilisateur n\'existe pas.'});
	if (user.id === req.user.id)
		return res.status(400).send({message: 'Vous ne pouvez pas vous suivre vous-même.'});
	if (user.followers.includes(req.user.id))
		return res.status(400).send({message: 'Vous suivez déjà cet utilisateur.'});
	// On ajoute un nouveau "follow" à l'auteur de la requête, et un nouveau "follower" à l'utilisateur demandé.
	user.followers.push(req.user.id);
	req.user.follows.push(user.id);
	await user.save();
	await req.user.save();
	return res.send({followed: true});
});

/**
 * GET /api/unfollow/:id
 * Ne suit plus un utilisateur.
 * :id - Id de l'utilisateur à ne plus suivre.
 */
router.get('/unfollow/:id', async (req, res) => {
	console.log(req.params.id);
	const user = await req.app.db.getUserById(req.params.id);
	if (!user)
		return res.status(400).send({message: 'Cet utilisateur n\'existe pas.'});
	if (user.id === req.user.id)
		return res.status(400).send({message: 'Vous ne pouvez pas vous suivre vous-même.'});
	if (!user.followers.includes(req.user.id))
		return res.status(400).send({message: 'Vous ne suivez pas cet utilisateur.'});
	// Même procédé que pour /api/follow/:id.
	user.followers = user.followers.filter(id => id !== req.user.id);
	req.user.follows = req.user.follows.filter( id => id !== user.id);
	await user.save();
	await req.user.save();
	return res.send({unfollowed: true});
});

module.exports = router;