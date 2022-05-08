const bcrypt = require('bcrypt');
const Tweet = require('./Tweet');

/**
 * Represents a user of the app. Contains formatted data of the user and methods to modify it in the database.
 */
class User {
	/**
	 * Database connection.
	 * @type {Database}
	 */
	#db;
	constructor(sqlRow, db) {

		this.#db = db;
		/**
		 * Id of this user.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * username of this user. Unique to each user.
		 * @type {string}
		 */
		this.username = sqlRow.username;
		/**
		 * Display name of this user. Falls back to username in the UI if not set.
		 * @type {?string}
		 */
		this.displayName = sqlRow.display_name || null;
		/**
		 * Email address of this user.
		 * @type {string}
		 */
		this.email = sqlRow.email;
		/**
		 * Password of this user. Encrypted with bcrypt.
		 * @type {string}
		 */
		this.encryptedPassword = sqlRow.password;
		/**
		 * Date of birth of this user.
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Id of the user's profile picture. Falls back to default profile picture in the UI if not set.
		 * @type {?string}
		 */
		this.avatarId = sqlRow.avatar_id || null;
		/**
		 * Id of the user's banner. Falls back to default banner in the UI if not set.
		 * @type {?string}
		 */
		this.bannerId = sqlRow.banner_id || null;
		/**
		 * Bio of this user.
		 * @type {?string}
		 */
		this.bio = sqlRow.bio || null;
		/**
		 * Website of this user.
		 * @type {?string}
		 */
		this.website = sqlRow.website || null;

		/**
		 * Location of this user. Not a real location, but rather a string set by the user.
		 * @type {?string}
		 */
		this.location = sqlRow.location || null;
		/**
		 * List of the ids of the users this user follows.
		 * @type {string[]}
		 */
		this.follows = sqlRow.follows;
		/**
		 * List of the ids of the followers of this user.
		 * @type {string[]}
		 */
		this.followers = sqlRow.followers;
		/**
		 * List of the ids of the tweets this user has liked.
		 * @type {string[]}
		 */
		this.likes = sqlRow.likes;
		/**
		 * Whether this user is an admin. Can only be set directly on the database.
		 * @type {boolean}
		 */
		this.isAdmin = sqlRow.is_admin === 1;
		/**
		 * Whether this user is suspended. A suspended user cannot login.
		 * @type {boolean}
		 */
		this.isSuspended = sqlRow.is_suspended === 1;
		/**
		 * Whether this user is deleted. A deleted user cannot be recovered and is deleted permanently from the database after 90 days.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted === 1;
	}

	/**
	 * Sets a new password for this user.
	 * @param {string} password The password to set.
	 */
	async updatePassword(password) {
		const hash = await bcrypt.hash(password, 10);
		await this.#db.connection.query(`UPDATE user SET password = ? WHERE id = ?`, [hash, this.id]);
		this.encryptedPassword = hash;
		this.#db.log.info(`[${this.id}] Password updated.`);
	}

	/**
	 * Saves to the database the changes made to this user.
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
		this.#db.log.info(`[${this.id}] Profile updated.`);
	}


	/**
	 * Generates an auth/password recovery token.
	 * @param {'auth' | 'recover'} table What the token will be used for. Either persistent auth or password recovery.
	 * @param {string} userAgent For `auth` only. The user-agent this auth token is usable with.
	 * @param {string} ip For `auth` only. The ip this auth token is usable with.
	 */
	async generateToken(table, userAgent, ip) {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$!';
		const token = Array(32)
			.fill()
			.map(() => chars[Math.floor(Math.random() * chars.length)])
			.join('');
		const [rows] = await this.#db.connection.query(`SELECT * FROM ${table} WHERE token = ? `, [token]);

		if (rows.length !== 0)
			return await this.generateToken(table, userAgent, ip);
		if (table === 'auth') {
			await this.#db.connection.query('INSERT INTO auth VALUES (?, ?, NOW(), ?, ?)', [this.id, token, userAgent, ip]);
			this.#db.log.info(`[${this.id}] Generated new auth token.`);
		} else {
			await this.#db.connection.query('DELETE FROM recover WHERE user_id = ?', [this.id]);
			await this.#db.connection.query('INSERT INTO recover VALUES (?, ?, NOW())', [this.id, token]);
			this.#db.log.info(`[${this.id}] Generated new recover token.`);
		}
		return token;
	}

	/**
	 * Gets the tweet to display on the user's homepage. 
	 * Includes tweets from the user's followers and the user's themself.
	 */
	async getTimeline() {
		// The query returns follows in this form: [[{follows: [...]}]]. We use nested destructuring to directly get the follows array.
		const [[{follows}]] = await this.#db.connection.query(`SELECT follows FROM user WHERE user.id = ?`, [this.id]);
		follows.push(this.id); // To include the user's own tweets in the timeline.
		const [woaw] = await this.#db.connection.query(
			'SELECT * FROM Tweet WHERE Tweet.author_id COLLATE utf8mb4_unicode_ci IN ' // Collate fixes a weird bug
			+ '(SELECT id FROM JSON_TABLE(' // Converts the follows JSON list into a table
			+ `'${JSON.stringify(follows)}',`
			+ ' \'$[*]\' COLUMNS(id CHAR(16) PATH \'$\' ERROR ON ERROR))'
			+ ' as follows) AND Tweet.is_deleted = 0 ORDER BY Tweet.created_at DESC'
		);
		return woaw.map(t => new Tweet(t, this.#db)); // Converts each raw tweet object into a Tweet instance.
	}

	/**
	 * Gets the non-deleted tweets sent by this user in chronological order.
	 * @returns {Promise<Tweet[]>}
	 */
	async getTweets() {
		const [tweets] = await this.#db.connection.query(`SELECT * FROM Tweet WHERE Tweet.author_id = ? AND Tweet.is_deleted = 0 ORDER BY Tweet.created_at DESC`, [this.id]);
		return tweets.map(t => new Tweet(t, this.#db));
	}

}
module.exports = User;