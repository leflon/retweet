if (MODE === 'register') {
	const form = document.getElementById('register-form');

	const inputs = {
		email: document.getElementById('email'),
		username: document.getElementById('username'),
		password: document.getElementById('password'),
		confirm: document.getElementById('pw-confirm'),
	};
	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	form.addEventListener('submit', e => {
		let anyError = false;
		// E-mail checks
		if (!inputs.email.value.match(emailRegex)) {
			inputs.email.classList.add('is-invalid');
			anyError = true;
		} else if (inputs.email.classList.contains('is-invalid'))
			inputs.email.classList.remove('is-invalid');
		// Username checks
		if (inputs.username.value.length < 3 || inputs.username.value.length > 16 || !/^[a-z\d_]+$/i.test(inputs.username.value)) {
			inputs.username.classList.add('is-invalid');
			anyError = true;
		} else if (inputs.username.classList.contains('is-invalid'))
			inputs.username.classList.remove('is-invalid');

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
