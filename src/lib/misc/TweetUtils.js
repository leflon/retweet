const Tweet = require('../db/Tweet');

/**
 * Instancie un tweet à partir d'une ligne de base de données.
 * En récupérant son auteur et son nombre de réponses non-supprimées.
 * @param {*} rawTweet Les données brut de base de données.
 * @param {Database} db L'utilitaire de base de données utilisé.
 * @returns {Promise<Tweet>}
 */
async function instanciateTweet(rawTweet, db) {
	const tweet = new Tweet(rawTweet, db);
	await tweet.fetchAuthor();
	await tweet.fetchRepliesCount();
	return tweet;
}

/**
 * Formatte un tweet de 'retweet' pour l'affichage dans l'app
 * @param {Tweet} tweet Le tweet de 'retweet'.
 * @param {Database} db L'utilitaire de base de données utilisé.
 * @returns {Promise<Tweet>} Retourne le tweet formatté, ou le tweet lui même si la mise en forme a échoué.
 */
async function formatRetweet(tweet, db) {
	let original;
	if (tweet.content.match(/^\/\/RT:[\w-]{16}$/)) {
		// Dans le cas d'un retweet, on n'envoie pas le "retweet" lui-même.
		// On récupère le tweet original et indique qu'il a été retweeté par un "retweeter".
		original = await db.getTweet(tweet.content.match(/^\/\/RT:[\w-]{16}$/)[0].slice(5));
		if (original)
			original.retweeter = tweet.author;
		else
			// Si on ne parvient pas à retrouver le tweet original,
			// Alors on ne peut pas considérer ce tweet comme un retweet.
			return tweet;
	} else
		// Si le contenu du tweet ne correspond pas à un retweet,
		// On peut retourner ce tweet.
		return tweet;
	return original;
}

/**
 * Met en forme une liste de tweets bruts pour l'affichage dans l'app.
 * @param {any[]} tweets Tweets bruts.
 * @param {Database} db L'utilitaire de base de données.
 * @returns {Promise<Tweet[]>} Retourne la liste de tweets/retweets formattés.
 */
async function formatTweetList(tweets, db) {
	const formatted = [];
	for (t of tweets) {
		let tweet = await instanciateTweet(t, db);
		// Si ce tweet représente un retweet, on le formate.
		// Sinon, la fonction retourne le tweet lui-même.
		tweet = await formatRetweet(tweet, db);
		formatted.push(tweet);
	}
	return formatted;
}

module.exports = {
	instanciateTweet,
	formatRetweet,
	formatTweetList
}