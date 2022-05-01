const textInputs = document.querySelectorAll('.text-input');
for (const elm of textInputs) {
	const input = elm.querySelector('input[type=\'text\'], input[type=\'password\']') || elm.querySelector('.textarea');
	if (input.type === 'password') {
		const eyeContainer = elm.querySelector('.text-input-eye');
		eyeContainer.addEventListener('click', () => {
			eyeContainer.classList.toggle('open');
			input.type = input.type === 'password' ? 'text' : 'password';
		});
	}
	if (input.className === 'textarea') {
		const actualInput = elm.querySelector(`input#${input.getAttribute('data-name')}`)
		input.addEventListener('input', e => {
			actualInput.value = e.target.innerText;
		});
		input.addEventListener('paste', e => {
			e.preventDefault();
			const text = e.clipboardData.getData('text/plain');
			document.execCommand('insertText', false, text)
			input.dispatchEvent(new Event('input'));
			e.preventDefault();
		})
	}
	const limit = parseInt(elm.getAttribute('limit'));
	if (!isNaN(limit)) {
		const limitIndicator = elm.querySelector('.limit-indicator');
		input.addEventListener('input', e => {
			let content = e.target.value || e.target.innerText;
			limitIndicator.innerText = `${content.length} / ${limit}`;
			if (content.length > limit)
				elm.classList.add('invalid');
			else
				elm.classList.remove('invalid');
		});
	}
}