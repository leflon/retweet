class Tweet {
    /**
     * Database connection.
     * @type {Database}
     */
    #db;

    constructor(sqlRow, db) {

        this.#db = db;
        /**
         * Id of the tweet.
         * @type {string}
         */
        this.id = sqlRow.id;
        /**
         * Content of the tweet.
         * @type {string}
         */
        this.content = sqlRow.content;
        /**
         * Id of the tweet's author.
         * @type {string}
         */
        this.authorId = sqlRow.author_id;
        /**
         * Id of the tweet's media.
         * @type {?string}
         */
        this.mediaId = sqlRow.media_id || null;
        /**
         * Date of publication of the tweet.
         * @type {Date}
         */
        this.createdAt = new Date(sqlRow.created_at);
        /**
         * Ids of the accounts that liked this tweet.
         * @type {string[]}
         */
        this.likes = sqlRow.likes;
        /**
         * Ids of the replies to this tweet.
         * @type {string[]}
         */
        this.replies = sqlRow.replies;
        /**
         * Ids of this tweet's retweets.
         * @type {string[]}
         */
        this.retweets = sqlRow.retweets;
        /**
         * Whether this tweet is deleted.
         * @type {boolean}
         */
        this.isDeleted = sqlRow.is_deleted === 1;
    }

    /**
     * Add a like to the tweet.
     * @param {string} userId The id of the user who likes this tweet.
     */
    async addLike(userId) {
        if (this.likes.indexOf(userId) !== -1) {
            const err = new Error(`User "${userId}" already likes this tweet.`);
            err.name = 'AlreadyLiked';
            throw err;
        }
        this.likes.push(userId);
        await this.#db.connection.query(`UPDATE tweet SET likes = ? WHERE id = ?`, [this.likes, this.id]);
        this.#db.log.info(`User ${userId} likes tweet ${this.id}.`);
    }

    /**
     * Remove a like from the tweet.
     * @param {string} userId The id of the user who unlikes this tweet.
     */
    async removeLike(userId) {
        index = this.likes.indexOf(userId);
        if (index === -1) {
            const err = new Error(`User "${userId}" do not likes this tweet.`);
            err.name = 'NotLiked';
            throw err;
        }
        this.likes.splice(index, 1);
        await this.#db.connection.query(`UPDATE tweet SET likes = ? WHERE id = ?`, [this.likes, this.id]);
        this.#db.log.info(`User ${userId} do not likes tweet ${this.id} anymore.`);
    }

    /**
     * Deletes this tweet.
     */
    async delete() {
        if (this.isDeleted) {
            const err = new Error(`Tweet "${this.id}" is already deleted.`);
            err.name = 'AlreadyDeleted';
            throw err;
        }
        this.isDeleted = true;
        await this.#db.connection.query(`UPDATE tweet SET is_deleted = 1 WHERE id = ?`, [this.id]);
        this.#db.log.info(`Tweet "${this.id}" deleted.`);
    }
}