class Image {
	/**
	 * Database connection.
	 * @type {Database}
	 */
	#db;

	constructor(sqlRow, db) {
		this.#db = db;
		/**
		 * Id de l'image.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * Chemin vers le fichier.
		 * @type {string}
		 */
		this.file = sqlRow.file;
		/**
		 * Type d'image : 0 pour un avatar, 1 pour une bannière, 2 pour une image de tweet.
		 * @type {integer}
		 */
		this.type = sqlRow.type;
		/**
		 * Id de l'utilisateur, si cette image est un avatar ou une bannière.
		 * @type {string}
		 */
		this.userId = sqlRow.user_id || null;
		/**
		 * Id du tweet, si cette image est une image de tweet.
		 * @type {string}
		 */
		this.tweetId = sqlRow.tweet_id || null;
		/**
		 * Date de création de l'image
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Si cette image a été supprimée.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted;
	}

	/**
	 * Supprime l'image.
	 * @returns {Promise<void>}
	 */
	async delete() {
		if (this.isDeleted)
			return;
		this.isDeleted = true
		await this.#db.connection.query(`UPDATE Image SET is_deleted = 1 WHERE id = ?`, [this.id]);
		this.#db.log.info(`Image "${this.id}" supprimée.`);
	}
}