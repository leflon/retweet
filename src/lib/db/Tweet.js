class Tweet {
	/**
	 * Connection à la base de données.
	 * @type {Database}
	 */
	#db;

	constructor(sqlRow, db) {

		this.#db = db;
		/**
		 * Id du tweet.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * Contenu du tweet.
		 * @type {string}
		 */
		this.content = sqlRow.content;
		/**
		 * Auteur du tweet.
		 * Doit être récupéré par un appel manuel de la méthode `fetchAuthor`.
		 * @type {?User}
		 */
		this.author = undefined;
		/**
		 * Id de l'auteur du tweet.
		 * @type {string}
		 */
		this.authorId = sqlRow.author_id;
		/**
		 * Id du média relié au tweet.
		 * @type {?string}
		 */
		this.imageId = sqlRow.image_id || null;
		/**
		 * Date de création du tweet.
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Id du tweet auquel ce tweet répond.
		 * @type {?string}
		 */
		this.repliesTo = sqlRow.replies_to;
		/**
		 * Nom d'utilisateur de l'auteur du tweet auquel ce tweet répond.
		 * @type {?string}
		 */
		this.repliesToUsername = sqlRow.replies_to_username;
		/**
		 * Ids des des utilisateurs ayant aimé le tweet.
		 * @type {string[]}
		 */
		this.likes = JSON.parse(sqlRow.likes);
		/**
		 * Ids des réponses à ce tweet.
		 * @type {string[]}
		 */
		this.replies = JSON.parse(sqlRow.replies);
		/**
		 * Nombre de réponses (non-supprimées) à ce tweet.
		 * @type {?number}
		 */
		this.repliesCount = undefined;
		/**
		 * Ids des utilisateurs ayant retweeté ce tweet.
		 * @type {string[]}
		 */
		this.retweets = JSON.parse(sqlRow.retweets);
		/**
		 * Si ce compte a été supprimé.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted === 1;
	}

	async fetchRepliesCount() {
		const [result] = await this.#db.connection.query(`SELECT COUNT(*) AS count FROM Tweet WHERE replies_to = ? AND is_deleted = 0`, [this.id]);
		this.repliesCount = result[0].count;
	}

	/**
	 * Récupère l'objet User de l'auteur du tweet.
	 * @returns {Promise<void>}
	 */
	async fetchAuthor() {
		// La récupération des données de l'auteur étant asynchrone, 
		// On ne peut l'effectuer dans le constructeur.
		this.author = await this.#db.getUserById(this.authorId);
	}

	/**
	 * Sauvegarde en base de données toute modification autorisée apportée à ce tweet.
	 * @returns {Promise<void>}
	 */
	async save() {
		await this.#db.connection.query(
			`UPDATE Tweet SET 
				likes = ?,
				replies = ?,
				retweets = ?
			WHERE id = ?`,
			[
				JSON.stringify(this.likes),
				JSON.stringify(this.replies),
				JSON.stringify(this.retweets),
				this.id
			]
		);
		this.#db.log.info(`[${this.id}] Informations mises à jour.`);
	}

	/**
	 * Supprime ce tweet.
	 * @returns {Promise<void>}
	 */
	async delete() {
		if (this.isDeleted)
			return;
		this.isDeleted = true;
		await this.#db.connection.query(`UPDATE Tweet SET is_deleted = 1 WHERE id = ?`, [this.id]);
		this.#db.log.info(`Tweet "${this.id}" supprimé.`);
	}
}
module.exports = Tweet;