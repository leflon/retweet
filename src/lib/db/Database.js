const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const Logger = require('../misc/Logger');
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
		this.log = new Logger('Database');
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
	 * Gets an account from the database by id.
	 * @param {string} id Id of account to get.
	 * @returns {Promise<?Account>} Account with given id. `null` if not found.
	 **/
	async getAccountById(id) {
		const [rows] = await this.connection.query('SELECT * FROM account WHERE id = ?', [id]);
		if (rows.length === 0)
			return null;
		return new Account(rows[0], this);
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
		return new Account(rows[0], this);
	}

	/**
	 * Inserts an account in the database.
	 * @param {object} data Required data to create the account.
	 * @param {string} data.username The username of the account.
	 * @param {string} data.email The e-mail of the account.
	 * @param {string} data.password The clear password of the account. Will be encrypted in this function.
	 * @returns {Account} The generated account object.
	 */
	async addAccount(data) {
		const id = await this.generateId();
		const createdAt = new Date();
		const encrypted = await bcrypt.hash(data.password, 10);
		await this.connection.query('INSERT INTO Account (id, username, email,  password, created_at, follows, followers, likes) VALUES (?, ?, ?, ?, ?, \'[]\', \'[]\', \'[]\')',
			[id, data.username, data.email, encrypted, createdAt]);
		this.log.info(`[${id}] Created account ${data.username}`);
		return new Account({
			id,
			username: data.username,
			email: data.email,
			password: encrypted,
			created_at: createdAt,
			follows: [],
			followers: [],
			likes: []
		}, this);
	}
}

module.exports = new Database(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD);