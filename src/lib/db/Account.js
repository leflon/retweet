/**
 * Represents an account of the app. Contains formatted data of the account and methods to modify it in the database.
 */
class Account {

	/**
	 * Max length of text based profile fields.
	 * @type {Object<string, number>}
	 */
	static #limitations = {
		bio: 160,
		displayName: 50,
		location: 30,
		website: 100
	};

	/**
	 * Database connection.
	 * @type {Database}
	 */
	#db;
	constructor(sqlRow, db) {

		this.#db = db;
		/**
		 * Id of this account.
		 * @type {string}
		 */
		this.id = sqlRow.id;
		/**
		 * username of this account. Unique to each account.
		 * @type {string}
		 */
		this.username = sqlRow.username;
		/**
		 * Display name of this account. Falls back to username in the UI if not set.
		 * @type {?string}
		 */
		this.displayName = sqlRow.display_name || null;
		/**
		 * Email address of this account.
		 * @type {string}
		 */
		this.email = sqlRow.email;
		/**
		 * Password of this account. Encrypted with bcrypt.
		 * @type {string}
		 */
		this.encryptedPassword = sqlRow.password;
		/**
		 * Date of birth of this account.
		 * @type {Date}
		 */
		this.createdAt = new Date(sqlRow.created_at);
		/**
		 * Id of the account's profile picture. Falls back to default profile picture in the UI if not set.
		 * @type {?string}
		 */
		this.avatarId = sqlRow.avatar_id || null;
		/**
		 * Id of the account's banner. Falls back to default banner in the UI if not set.
		 * @type {?string}
		 */
		this.bannerId = sqlRow.banner_id || null;
		/**
		 * Bio of this account.
		 * @type {?string}
		 */
		this.bio = sqlRow.bio || null;
		/**
		 * Website of this account.
		 * @type {?string}
		 */
		this.website = sqlRow.website || null;

		/**
		 * Location of this account. Not a real location, but rather a string set by the user.
		 * @type {?string}
		 */
		this.location = sqlRow.location || null;
		/**
		 * List of the ids of the accounts this account follows.
		 * @type {string[]}
		 */
		this.follows = sqlRow.follows;
		/**
		 * List of the ids of the followers of this account.
		 * @type {string[]}
		 */
		this.followers = sqlRow.followers;
		/**
		 * List of the ids of the tweets this account has liked.
		 * @type {string[]}
		 */
		this.likes = sqlRow.likes;
		/**
		 * Whether this account is an admin. Can only be set directly on the database.
		 * @type {boolean}
		 */
		this.isAdmin = sqlRow.is_admin === 1;
		/**
		 * Whether this account is suspended. A suspended account cannot login.
		 * @type {boolean}
		 */
		this.isSuspended = sqlRow.is_suspended === 1;
		/**
		 * Whether this account is deleted. A deleted account cannot be recovered and is deleted permanently from the database after 90 days.
		 * @type {boolean}
		 */
		this.isDeleted = sqlRow.is_deleted === 1;
	}

	/**
	 * Sets a text based profile field.
	 * @param { 'bio' | 'displayName' | 'location' | 'website'} field The field to set. 
	 * @param {string} value The value to assign to the field.
	 */
	async setProfileField(field, value) {
		if (!['bio', 'displayName', 'location', 'website'].includes(field)) {
			const err = new Error(`${field} is not a valid profile field`);
			err.name = 'InvalidProfileField';
			throw err;
		}
		const sqlCol = field.replace(/([A-Z])/g, (_, p1) => `_${p1.toLowerCase()}`); // Formats field name to snake case for the SQL query.
		if (typeof value !== 'string' || value === '') {
			const err = new Error(`${field} must be a non-empty string.`);
			err.name = 'InvalidProfileField';
			throw err;
		}
		if (value.length > Account.#limitations[field]) {
			const err = new Error(`${field} must be ${Account.#limitations[field]} characters long or shorter.`);
			err.name = 'ProfileFieldTooLong';
			throw err;
		}
		await this.#db.connection.query(`UPDATE account SET ${sqlCol} = ? WHERE id = ?`, [value, this.id]);
		const old = this[field];
		this[field] = value;
		this.#db.log.info(`[${this.id}] ${field} : "${old}" -> "${value}"`);
	}

	async #editList(field, value, action) {
		if (action === 'add') {
			if (this[field].indexOf(value) === -1) {
			this[field].push(value);
			}
			this.#db.log.info(`[${this.id}] ${field} : "${value}" added.`);
		}
		if (action === 'remove') {
			const index = this[field].indexOf(value);
			if (index != -1){
			this[field].pos(index, 1);
			}
			this.#db.log.info(`[${this.id}] ${field} : "${value}" removed.`);
		}
	}

	async addFollower(followerId) {
		this.#editList('followers', followerId, 'add');
	}

	async removeFollower(followerId) {
		this.#editList('followers', followerId, 'remove');
	}

	async addFollow(followId) {
		this.#editList('follows', followId, 'add');
	}

	async removeFollow(followId) {
		this.#editList('follows', followId, 'remove');
	}

	async addLike(tweetId) {
		this.#editList('likes', tweetId, 'add');
	}

	async removeLike(tweetId) {
		this.#editList('likes', tweetId, 'remove');
	}

	async generateToken(userAgent, ip) {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$!';
		const token = Array(32)
			.fill()
			.map(() => chars[Math.floor(Math.random() * chars.length)])
			.join('');
		const [rows] = await this.#db.connection.query('SELECT * FROM auth WHERE token = ? ', [token]);

		if (rows.length !== 0)
			return await this.generateToken();
		const z = n => n < 10 ? `0${n}` : `${n}`;
		const d = new Date();
		const datetime = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
		await this.#db.connection.query('INSERT INTO auth VALUES (?, ?, ?, ?, ?)', [this.id, token, datetime, userAgent, ip]);
		this.#db.log.info(`[${this.id}] Generated new auth token. (UA: "${userAgent}", IP: ${ip})`);
		return token;
	}

}
module.exports = Account;