if (MODE === 'register') {
	const form = document.getElementById('register-form');
	const inputs = {
		email: document.getElementById('text-input-email'),
		username: document.getElementById('text-input-username'),
		password: document.getElementById('text-input-password'),
		confirm: document.getElementById('text-input-pw-confirm'),
	};

	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	form.addEventListener('submit', e => {
		let anyError = false;
		// Vérification de l'email
		// Pour chaque vérification, si la valeur est incorrecte,
		// On indique qu'il y a une erreur pour empêcher l'envoi du formulaire
		// et on rend l'input invalide pour indiquer l'erreur à l'utilisateur.
		// Sinon, on rend l'input de nouveau valide.
		const email = inputs.email.querySelector('input').value;
		if (!email.match(emailRegex)) {
			inputs.email.classList.add('invalid');
			anyError = true;
		} else inputs.email.classList.remove('invalid');
		// Vérification du nom d'utilisateur
		// Il doit faire entre 3 et 16 caractères et ne doit contenir que des caractères alphanumériques ou underscore.
		const username = inputs.username.querySelector('input').value;
		if (username.length < 3
			|| username.length > 16
			|| !/^[a-z\d_]+$/i.test(username)) {
			inputs.username.classList.add('invalid');
			anyError = true;
		} else inputs.username.classList.remove('invalid');

		// Vérification du mot de passe
		// Il doit faire entre 8 et 50 caractères,
		// Contenir un symbole, une minuscule, une majuscule et un chiffre.
		const password = inputs.password.querySelector('input').value;
		if (password.length < 8 || password.length > 50 ||
			/^[a-z A-Z\p{L}\p{M}\d]+$/gu.test(password) || // Vrai s'il n'y a pas de symbole
			!/\d/.test(password) || // Vrai s'il n'y a pas de chiffre
			!/[A-Z]/.test(password) || // Vrai s'il n'y a pas de majuscule
			!/[a-z]/.test(password)) { // Vrai s'il n'y a pas de minuscule
			inputs.password.classList.add('invalid');
			anyError = true;
		} else inputs.password.classList.remove('invalid');

		// Vérification du deuxième mot de passe
		// Sa valeur doit être identique au premier mot de passe.
		const passwordConfirmed = inputs.confirm.querySelector('input').value;
		if (passwordConfirmed !== password) {
			inputs.confirm.classList.add('invalid');
			anyError = true;
		} else inputs.confirm.classList.remove('invalid');

		if (anyError)
			e.preventDefault();
	});
}

if (MODE === 'recover-step2') {
	const form = document.getElementById('recover-step2');
	const inputs = {
		password: document.getElementById('password'),
		confirm: document.getElementById('pw-confirm'),
	};
	const ut = new URLSearchParams(window.location.search).get('ut');
	form.action = `/renew-password?ut=${ut}`;
	// Même vérifications que dans le formulaire d'inscription.
	form.addEventListener('submit', e => {
		let anyError = false;
		if (inputs.password.value.length < 8 || inputs.password.value.length > 50 ||
			/^[a-z A-Z\p{L}\p{M}\d]+$/gu.test(inputs.password.value) ||
			!/\d/.test(inputs.password.value) ||
			!/[A-Z]/.test(inputs.password.value) ||
			!/[a-z]/.test(inputs.password.value)) {
			inputs.password.classList.add('is-invalid');
			anyError = true;
		} else inputs.password.classList.remove('is-invalid');

		if (inputs.password.value !== inputs.confirm.value) {
			inputs.confirm.classList.add('is-invalid');
			anyError = true;
		} else inputs.confirm.classList.remove('is-invalid');

		if (anyError)
			e.preventDefault();
	});
}