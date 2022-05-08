class Media {
	/**
	 * Database connection.
	 * @type {Database}
	 */
	#db;

	constructor(sqlRow, db) {
		this.#db = db;
		/**
		 * id of the media.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * Path to the media's file.
		 * @type {string}
		 */
		this.file = sqlRow.file;
		/**
		 * Type of the tweet : 0 for an avatar, 1 for a banner, 2 for a tweet's media.
		 * @type {integer}
		 */
		this.type = sqlRow.type;
		/**
		 * Id of the user. Only for avatars and banners.
		 * @type {string}
		 */
		this.userId = sqlRow.user_id || null;
		/**
		 * Id of the tweet. Only for a tweet's media.
		 * @type {string}
		 */
		this.tweetId = sqlRow.tweet_id || null;
		/**
		 * Date of birth of this media.
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Whether this media is deleted.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted;
	}

	/**
	 * Deletes this media.
	 */
	async delete() {
		if (this.isDeleted) {
			const err = new Error(`Media "${this.id}" is already deleted`);
			err.name = 'AlreadyDeleted';
			throw err;
		}
		this.isDeleted = true
		await this.#db.connection.query(`UPDATE media SET is_deleted = 1 WHERE id = ?`, [this.id]);
		this.#db.log.info(`Media "${this.id}" deleted.`);
	}
}