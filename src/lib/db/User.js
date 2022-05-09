const bcrypt = require('bcrypt');
const Tweet = require('./Tweet');

class User {
	/**
	 * Connexion à la base de données.
	 * @type {Database}
	 */
	#db;
	constructor(sqlRow, db) {

		this.#db = db;
		/**
		 * Id de l'utilisateur.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * Nom d'utilisateur, unique à chaque utilisateur.
		 * @type {string}
		 */
		this.username = sqlRow.username;
		/**
		 * Nom d'affichage de l'utilisateur.
		 * @type {?string}
		 */
		this.displayName = sqlRow.display_name || null;
		/**
		 * Adresse e-mail de l'utilisateur.
		 * @type {string}
		 */
		this.email = sqlRow.email;
		/**
		 * Mot de passe encrypté de l'utilisateur.
		 * @type {string}
		 */
		this.encryptedPassword = sqlRow.password;
		/**
		 * Date de création du compte.
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Id de l'avatar de l'utilisateur.
		 * @type {?string}
		 */
		this.avatarId = sqlRow.avatar_id || null;
		/**
		 * Id de la bannière de l'utilisateur.
		 * @type {?string}
		 */
		this.bannerId = sqlRow.banner_id || null;
		/**
		 * Bio de l'utilisateur.
		 * @type {?string}
		 */
		this.bio = sqlRow.bio || null;
		/**
		 * Site internet de l'utilisateur.
		 * @type {?string}
		 */
		this.website = sqlRow.website || null;

		/**
		 * Localisation (définie manuellement) de l'utilisateur.
		 * @type {?string}
		 */
		this.location = sqlRow.location || null;
		/**
		 * Liste des Id des utilisateurs suivis par cet utilisateur.
		 * @type {string[]}
		 */
		this.follows = sqlRow.follows;
		/**
		 * Liste des Id des utilisateurs suivant cet utilisateur.
		 * @type {string[]}
		 */
		this.followers = sqlRow.followers;
		/**
		 * Liste des Id des tweets aimés par cet utilisateur.
		 * @type {string[]}
		 */
		this.likes = sqlRow.likes;
		/**
		 * Si cet utilisateur est un administrateur. Défini manuellement dans la base de données.
		 * @type {boolean}
		 */
		this.isAdmin = sqlRow.is_admin === 1;
		/**
		 * Si cet utilisateur est suspendu. Dans ce cas, il ne peut pas se connecter.
		 * @type {boolean}
		 */
		this.isSuspended = sqlRow.is_suspended === 1;
		/**
		 * Si cet utilisateur a supprimé son compte. Le cas échéant, ce compte reste en base de données à titre d'archive.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted === 1;
	}

	/**
	 * Change le mot de passe de l'utilisateur.
	 * @param {string} password Le nouveau mot de passe, en clair.
	 */
	async updatePassword(password) {
		const hash = await bcrypt.hash(password, 10);
		await this.#db.connection.query(`UPDATE user SET password = ? WHERE id = ?`, [hash, this.id]);
		this.encryptedPassword = hash;
		this.#db.log.info(`[${this.id}] Mot de passe mis à jour.`);
	}

	/**
	 * Sauvegarde en base de données toute modification autorisée apportée à l'utilisateur.
	 */
	async save() {
		await this.#db.connection.query(
			`UPDATE user SET 
			display_name = ?,
				avatar_id = ?,
				banner_id = ?,
				bio = ?,
				website = ?,
				location = ?,
				follows = ?,
				followers = ?,
				likes = ?
				WHERE id = ?`,
			[
				this.displayName,
				this.avatarId,
				this.bannerId,
				this.bio,
				this.website,
				this.location,
				JSON.stringify(this.follows),
				JSON.stringify(this.followers),
				JSON.stringify(this.likes),
				this.id
			]
		);
		this.#db.log.info(`[${this.id}] Informations mises à jour.`);
	}


	/**
	 * Génère un token d'authentification ou de récupération de mot de passe.
	 * @param {'auth' | 'recover'} table Type de token à générer.
	 * @param {string} userAgent L'user-agent lié au token (pour un token auth).
	 * @param {string} ip L'ip liée au token (pour un token auth).
	 */
	async generateToken(table, userAgent, ip) {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$!';
		const token = Array(32)
			.fill()
			.map(() => chars[Math.floor(Math.random() * chars.length)])
			.join('');
		const [rows] = await this.#db.connection.query(`SELECT * FROM ${table} WHERE token = ? `, [token]);
		// Si le token existe déjà, on en génère un autre récursivement.
		if (rows.length !== 0)
			return await this.generateToken(table, userAgent, ip);
		if (table === 'auth') {
			await this.#db.connection.query('INSERT INTO auth VALUES (?, ?, NOW(), ?, ?)', [this.id, token, userAgent, ip]);
			this.#db.log.info(`[${this.id}] Token d'authentification généré.`);
		} else {
			await this.#db.connection.query('DELETE FROM recover WHERE user_id = ?', [this.id]);
			await this.#db.connection.query('INSERT INTO recover VALUES (?, ?, NOW())', [this.id, token]);
			this.#db.log.info(`[${this.id}] Token de récupération généré.`);
		}
		return token;
	}

	/**
	 * Récupère les tweets à afficher sur la timeline de l'utilisateur.
	 * Cela inclue les tweets des comptes suivis, leurs retweets, ainsi que ceux de l'utilisateur lui-même.
	 */
	async getTimeline() {
		// La requête renvoie un objet de cette forme : [[{follows: [...]}]]. 
		// On utilise des destructurations imbriquées pour récupérer le tableau simple des comptes suivis.
		const [[{follows}]] = await this.#db.connection.query(`SELECT follows FROM user WHERE user.id = ?`, [this.id]);
		follows.push(this.id); // Inclue l'utilisateur lui-même dans les comptes dont les tweets sont récupérés.
		const [tweets] = await this.#db.connection.query(
			'SELECT * FROM Tweet WHERE Tweet.author_id COLLATE utf8mb4_unicode_ci IN ' // Collate corrige un bug étrange
			+ '(SELECT id FROM JSON_TABLE(' // Convertis la liste JSON en table SQL
			+ `'${JSON.stringify(follows)}',`
			+ ' \'$[*]\' COLUMNS(id CHAR(16) PATH \'$\' ERROR ON ERROR))'
			+ ' as follows) AND Tweet.is_deleted = 0 ORDER BY Tweet.created_at DESC'
		);
		return tweets.map(t => new Tweet(t, this.#db)); // Convertis chaque tweet brut en instance de Tweet.
	}

	/**
	 * Récupère les tweets envoyés par l'utilisateur.
	 * @returns {Promise<Tweet[]>}
	 */
	async getTweets() {
		const [tweets] = await this.#db.connection.query(`SELECT * FROM Tweet WHERE Tweet.author_id = ? AND Tweet.is_deleted = 0 ORDER BY Tweet.created_at DESC`, [this.id]);
		return tweets.map(t => new Tweet(t, this.#db));
	}

	/**
	 * Récupère les tweets aimés par cet utilisateur.
	 * @returns ]{Promise<Tweet[]>}
	 */
	async getLikes() {
		// Même destructuration que pour getTimeline().
		const [[{likes}]] = await this.#db.connection.query(`SELECT likes FROM User WHERE user.id = ?`, [this.id]);
		const [tweets] = await this.#db.connection.query(
			'SELECT * FROM Tweet WHERE Tweet.id COLLATE utf8mb4_unicode_ci IN ' // Collate corrige un bug étrange
			+ '(SELECT id FROM JSON_TABLE('
			+ `'${JSON.stringify(likes)}',`
			+ ' \'$[*]\' COLUMNS(id CHAR(16) PATH \'$\' ERROR ON ERROR))'
			+ ' as likes) AND Tweet.is_deleted = 0 '
			// On ordonne ces tweets en fonction de quand ils ont été aimés par l'utilisateur.
			+ `ORDER BY FIELD(Tweet.id, ${likes.reverse().map(t => `"${t}"`).join(', ')})` // `reverse` afin d'avoir les tweets aimés les plus récemment en premier.
		);
		return tweets.map(t => new Tweet(t, this.#db)); // Convertis chaque tweet brut en instance de Tweet.
	}

}
module.exports = User;