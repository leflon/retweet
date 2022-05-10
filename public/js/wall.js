// To-Do: refactor this shit ^^

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
		// E-mail checks
		const email = inputs.email.querySelector('input').value;
		if (!email.match(emailRegex)) {
			inputs.email.classList.add('invalid');
			anyError = true;
		} else if (inputs.email.classList.contains('invalid'))
			inputs.email.classList.remove('invalid');
		// Username checks
		const username = inputs.username.querySelector('input').value;
		if (username.length < 3
			|| username.length > 16
			|| !/^[a-z\d_]+$/i.test(username)) {
			inputs.username.classList.add('invalid');
			anyError = true;
		} else if (inputs.username.classList.contains('invalid'))
			inputs.username.classList.remove('invalid');

		// Password checks
		const password = inputs.password.querySelector('input').value;
		if (password.length < 8 || password.length > 50 ||
			/^[a-z A-Z\p{L}\p{M}\d]+$/gu.test(password) || // true if no symbol
			!/\d/.test(password) || // true if no number
			!/[A-Z]/.test(password) || // true if no capital letter
			!/[a-z]/.test(password)) { // true if no lowercase letter
			inputs.password.classList.add('invalid');
			anyError = true;
		} else if (inputs.password.classList.contains('invalid'))
			inputs.password.classList.remove('invalid');

		// Confirm password checks
		const passwordConfirmed = inputs.confirm.querySelector('input').value;
		if (passwordConfirmed !== password) {
			inputs.confirm.classList.add('invalid');
			anyError = true;
		} else if (inputs.confirm.classList.contains('invalid'))
			inputs.confirm.classList.remove('invalid');
		console.log({username, email, password, passwordConfirmed});
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
	form.addEventListener('submit', e => {
		let anyError = false;
		// Password checks
		if (inputs.password.value.length < 8 || inputs.password.value.length > 50 ||
			/^[a-z A-Z\p{L}\p{M}\d]+$/gu.test(inputs.password.value) || // true if no symbol
			!/\d/.test(inputs.password.value) || // true if no number
			!/[A-Z]/.test(inputs.password.value) || // true if no capital letter
			!/[a-z]/.test(inputs.password.value)) { // true if no lowercase letter
			inputs.password.classList.add('is-invalid');
			anyError = true;
		} else if (inputs.password.classList.contains('is-invalid'))
			inputs.password.classList.remove('is-invalid');

		// Confirm password checks
		if (inputs.password.value !== inputs.confirm.value) {
			inputs.confirm.classList.add('is-invalid');
			anyError = true;
		} else if (inputs.confirm.classList.contains('is-invalid'))
			inputs.confirm.classList.remove('is-invalid');

		if (anyError)
			e.preventDefault();
	});
}