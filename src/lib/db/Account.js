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
		this.displayName = sqlRow.display_name;
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
		this.avatarId = sqlRow.avatar_id;
		/**
		 * Id of the account's banner. Falls back to default banner in the UI if not set.
		 * @type {?string}
		 */
		this.bannerId = sqlRow.banner_id;
		/**
		 * Bio of this account.
		 * @type {?string}
		 */
		this.bio = sqlRow.bio;
		/**
		 * Website of this account.
		 * @type {?string}
		 */
		this.website = sqlRow.website;

		/**
		 * Location of this account. Not a real location, but rather a string set by the user.
		 * @type {?string}
		 */
		this.location = sqlRow.location;
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

}
module.exports = Account;