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
	const inputContainers = form.querySelectorAll('.text-input');
	sendButton.addEventListener('click', () => {
		for (const elm of inputContainers) {
			const input = elm.querySelector('input');
			const limit = parseInt(elm.getAttribute('limit'));
			const content = input.value;
			if (content.length > limit)
				return;
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
		if (file) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				img.src = reader.result;
			});
			reader.readAsDataURL(file);
		}
	};
	avatarInput.addEventListener('change', onChange);
	bannerInput.addEventListener('change', onChange);
} else {
	const followToggle = document.querySelector('#follow-toggle');
	followToggle.addEventListener('click', async () => {
		const id = PROFILE.id;
		const action = followToggle.getAttribute('action');
		await fetch(`/api/${action}/${id}`);
		followToggle.setAttribute('action', action === 'follow' ? 'unfollow' : 'follow');
		followToggle.innerText = action === 'follow' ? 'Suivre' : 'Suivi';
		followToggle.classList.toggle('alt');
	});
	followToggle.addEventListener('mouseenter', () => {
		const action = followToggle.getAttribute('action');
		if (action === 'unfollow')
			followToggle.innerText = 'Ne plus suivre';
	});
	followToggle.addEventListener('mouseleave', () => {
		const action = followToggle.getAttribute('action');
		if (action === 'unfollow')
			followToggle.innerText = 'Suivi';
	});

}