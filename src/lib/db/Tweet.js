/**
 * Represents a Tweet.
 */
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
         * Author of the tweet.
         * Must be fetched manually.
         * @type {?Account}
         */
        this.author = undefined;
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
         * @type {?string}
         */
        this.repliesTo = sqlRow.replies_to;
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
     * Fetches the Account instance corresponding to the author of this tweet.
     */
    async fetchAuthor() {
        this.author = await this.#db.getAccountById(this.authorId);
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
        this.#db.log.info(`Added like from ${userId} on tweet ${this.id}.`);
    }

    /**
     * Removes a like from the tweet.
     * @param {string} userId The id of the user who unlikes this tweet.
     */
    async removeLike(userId) {
        index = this.likes.indexOf(userId);
        if (index === -1) {
            const err = new Error(`User "${userId}" does not like this tweet.`);
            err.name = 'NotLiked';
            throw err;
        }
        this.likes.splice(index, 1);
        await this.#db.connection.query(`UPDATE tweet SET likes = ? WHERE id = ?`, [this.likes, this.id]);
        this.#db.log.info(`Removed like from ${userId} on tweet ${this.id}.`);
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

    /**
     * Adds from one of the lists ine the account table.
     * @param {'replies' | 'retweets'} field The list to edit.
     * @param {string} tweetId The id of the tweet to add.
     */
    async #editList(field, tweetId) {
        this[field].push(tweetId);
        await this.#db.connection.query(`UPDATE tweet SET ${field} = ? WHERE id = ?`, [this[field], this.id]);
        if (field === 'replies')
            this.#db.log.info(`Added reply to Tweet "${this.id}".`);
        else
            this.#db.log.info(`Added retweet to Tweet "${this.id}".`);

    }

    /**
     * Adds a tweet to replies.
     * @param {string} tweetId The id of the tweet to add.
     */
    async addReply(tweetId) {
        this.#editList('replies', tweetId);
    }

    /**
     * Adds a tweet to retweets.
     * @param {string} tweetId The id of the tweet to add.
     */
    async addRetweet(tweetId) {
        this.#editList('retweets', tweetId);
    }
}
module.exports = Tweet;