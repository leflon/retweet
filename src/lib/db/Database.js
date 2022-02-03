const mysql = require('mysql2/promise');
const Account = require('./Account');

/**
 * Utility class for interacting with the MySQL database.
 */
class Database {
	/**
	 * @param {string} host Hostname of the database.
	 * @param {string} user User to connect to the database with.
	 * @param {string} password Password of the given user.
	 */
	constructor(host, user, password) {
		this.host = host;
		this.user = user;
		this.password = password;
		this.connection = null;
	}

	/**
	 * Connects to the database.
	 */
	async connect() {
		this.connection = await mysql.createConnection({
			host: this.host,
			user: this.user,
			password: this.password,
			database: 'retweet'
		});
	}

	/**
	 * Generates an id not already in the database.
	 * @returns {Promise<string>} Generated id.
	 */
	async generateId() {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
		const id = Array(16)
			.fill()
			.map(() => chars[Math.floor(Math.random() * chars.length)])
			.join('');
		const [rows] = await this.connection.query('SELECT * FROM id WHERE id = ? ', [id]);
		if (rows.length !== 0)
			return await this.generateId();
		return id;
	}

	/**
	 * Gets an account from the database by username.
	 * @param {string} username Username of account to get.
	 * @returns {Promise<?Account>} Account with given username. `null` if not found.
	 **/
	async getAccount(username) {
		const [rows] = await this.connection.query('SELECT * FROM account WHERE username= ? ', [username]);
		if (rows.length === 0) {
			return null;
		}
		return new Account(rows[0], this.connection);
	}

}
module.exports = Database;