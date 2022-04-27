const createdAt = document.querySelector('#profile-created-at span');
moment.locale('fr');
createdAt.innerText = `A rejoint Retweet en ${moment(createdAt.getAttribute('date')).month(1).format('MMMM YYYY')}`;

if (USER.id === PROFILE.id) {
	const editContainer = document.getElementById('profile-editor-container');
	const openBtn = document.getElementById('open-profile-editor');
	openBtn.addEventListener('click', () => editContainer.classList.add('visible'));

	closeBtn = editContainer.querySelector('#profile-editor-close');
	closeBtn.addEventListener('click', () => editContainer.classList.remove('visible'));

	const form = editContainer.querySelector('form');
	const sendButton = editContainer.querySelector('#profile-editor-save');

	const inputContainers = document.querySelectorAll('.input-container');
	for (const elm of inputContainers) {
		const input = elm.querySelector('input') || elm.querySelector('div[contentEditable]');
		const limit = parseInt(elm.getAttribute('limit'));
		const limitIndicator = document.createElement('div');
		limitIndicator.className = 'limit-indicator';
		elm.appendChild(limitIndicator);
		input.addEventListener('input', e => {
			let content = e.target.value || e.target.innerText;
			limitIndicator.innerText = `${content.length} / ${limit}`;
			if (content.length > limit)
				elm.classList.add('invalid');
			else
				elm.classList.remove('invalid');
		});
	}
	sendButton.addEventListener('click', () => {
		for (const elm of inputContainers) {
			const input = elm.querySelector('input') || elm.querySelector('div[contentEditable]');
			const limit = parseInt(elm.getAttribute('limit'));
			const content = input.value || input.innerText;
			if (content.length > limit)
				return;
			if (input.id === 'bio-editor') {
				const sentField = form.querySelector('input[name=\'bio\']');
				sentField.value = content;
			}
			if (input.name === 'website' && !/^(http|https):\/\//.test(content)) {
				input.value = `https://${content}`;
			}
		}
		form.submit();
	});
	const avatarInput = form.querySelector('input#avatar');
	const bannerInput = form.querySelector('input#banner');
	const onChange = e => {
		console.log(e);
		const file = e.target.files[0];
		const img = form.querySelector(`.profile-${e.target.id} img`);
		console.log(img);
		if (file) {
			console.log('alors');
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				img.src = reader.result;
			});
			reader.readAsDataURL(file);
		}
	};
	avatarInput.addEventListener('change', onChange);
	bannerInput.addEventListener('change', onChange);
}