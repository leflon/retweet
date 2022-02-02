const colors = require('colors/safe');
/**
 * Utility class for logging.
 */
class Logger {
	/**
	 * @param {string} name The name of the logger. 
	 */
	constructor(name) {
		if (typeof name !== 'string' || name.length === 0) {
			throw new Error('Logger name must be a non-empty string.');
		}
		this.name = name;
	}

	/**
	 * Prints a message to the console with desired formatting.
	 * @param {'INFO' | 'WARN' | 'ERROR' | 'DEBUG'} type The type of log message.
	 * @param {any[]} content The content of the log message.
	 */
	#print(type, ...content) {
		const color = colors[Logger.#colors[type]]; // Gets the appropriate color function from the colors module.
		if (type === 'DEBUG') {
			// We use process.stdout.write instead of console.log to avoid the newline character.
			process.stdout.write(`${new Date().toISOString()} [${this.name}] ${color(type)} : `);
			for (const arg of content) {
				if (typeof arg === 'object')
					// console.log automatically pretty-prints objects. Useful for debugging.
					console.log(arg);
				else
					process.stdout.write(`${arg} `);
			}
			console.log(`${color('END')}`); // In case a large object was logged, we clearly set the end of the message.
		} else {
			const message = content.join(' ');
			console.log(`${new Date().toISOString()} [${this.name}] ${color(type)} : ${color.reset(message)}`);
		}
	}

	/**
	 * Logs an info message.
	 * @param {string[]} content The content of the log message.
	 */
	info(...content) {
		this.#print('INFO', ...content);
	}

	/**
	 * Logs a warn message.
	 * @param {string[]} content The content of the log message.
	 */
	warn(...content) {
		this.#print('WARN', ...content);
	}

	/**
	 * Logs an error message.
	 * @param {string[]} content The content of the log message.
	 */
	error(...content) {
		this.#print('ERROR', ...content);
	}

	/**
	 * Logs a debug  message. Will not be printed unless `NODE_ENV` is set to `development`.
	 * @param {any[]} content The content of the log message.
	 */
	debug(...content) {
		if (process.env.NODE_ENV != 'development') {
			this.#print('DEBUG', ...content);
		}
	}

	/**
	 * Alias for console.log
	 * @param  {string[]} content The content of the log message.
	 */
	raw(...content) {
		console.log(...content);
	}

	static #colors = {
		INFO: 'cyan',
		WARN: 'yellow',
		ERROR: 'red',
		DEBUG: 'blue'
	};
}
module.exports = Logger;