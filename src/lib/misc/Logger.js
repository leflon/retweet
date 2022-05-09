const colors = require('colors/safe');
/**
 * Classe utilitaire pour mettre en forme les messages de log.
 */
class Logger {
	/**
	 * @param {string} name Nom de ce Logger. 
	 */
	constructor(name) {
		if (typeof name !== 'string' || name.length === 0) {
			throw new Error('Le nom du Logger doit être une chaîne de caractères non-vide.');
		}
		this.name = name;
	}

	/**
	 * Affiche un message de log avec la mise en forme demandée.
	 * @param {'INFO' | 'WARN' | 'ERROR' | 'DEBUG'} type Type de log.
	 * @param {any[]} content Contenu du message.
	 */
	#print(type, ...content) {
		const color = colors[Logger.#colors[type]]; // Obtient la couleur associée au type de log.
		if (type === 'DEBUG') {
			// process.stdout.write évite le retour à la ligne.
			// Si un objet doit être affiché, on veut contrôler le retour à la ligne pour éviter les lignes vides.
			process.stdout.write(`${new Date().toISOString()} [${this.name}] ${color(type)} : `);
			for (const arg of content) {
				if (typeof arg === 'object')
					// console.log formatte automatiquement les objets.
					console.log(arg);
				else
					process.stdout.write(`${arg} `);
			}
			console.log(`${color('END')}`); // Si jamais un gros objet a été affiché, on indique clarement la fin du message de log.
		} else {
			// Il n'y a pas de raison d'afficher autre chose que du texte simple hors debug.
			// On n'a donc pas besoin de plus qu'un console.log;
			const message = content.join(' ');
			console.log(`${new Date().toISOString()} [${this.name}] ${color(type)} : ${color.reset(message)}`);
		}
	}

	/**
	 * Log un message de type INFO.
	 * @param {string[]} content Contenu du message.
	 */
	info(...content) {
		this.#print('INFO', ...content);
	}

	/**
	 * Log un message de type WARN.
	 * @param {string[]} content Contenu du message.
	 */
	warn(...content) {
		this.#print('WARN', ...content);
	}

	/**
	 * Log un message de type ERROR.
	 * @param {string[]} content Contenu du message.
	 */
	error(...content) {
		this.#print('ERROR', ...content);
	}

	/**
	 * Log un message de type DEBUG. Affiché uniquement si `NODE_ENV` est `development`.
	 * @param {any[]} content Contenu du message.
	 */
	debug(...content) {
		if (process.env.NODE_ENV != 'development')
			this.#print('DEBUG', ...content);
	}

	/**
	 * Alias pour console.log
	 * @param  {string[]} content Contenu du message.
	 */
	raw(...content) {
		console.log(...content);
	}

	// Couleurs associées aux types de log, pour le module `colors`.
	static #colors = {
		INFO: 'cyan',
		WARN: 'yellow',
		ERROR: 'red',
		DEBUG: 'blue'
	};
}
module.exports = Logger;