const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');

for (const input of inputs) {
	const clone = input.cloneNode(true);
	clone.setAttribute('placeholder', ' ');
	const wrapper = document.createElement('div');
	wrapper.classList.add('text-input');
	wrapper.appendChild(clone);
	const placeholder = document.createElement('div');
	placeholder.classList.add('input-placeholder');
	placeholder.textContent = input.placeholder;
	wrapper.appendChild(placeholder);

	if (input.getAttribute('type') === 'password') {
		const eye = document.createElement('div');
		eye.classList.add('eye');
		eye.addEventListener('click', () => {
			input.type = input.type === 'password' ? 'text' : 'password';
			eye.classList.toggle('open');
		});
		wrapper.appendChild(eye);
	}
	input.insertAdjacentElement('afterend', wrapper);
	input.remove();
}

