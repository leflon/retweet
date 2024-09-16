const createdAt = document.querySelector('#profile-created-at span');
moment.locale('fr');
createdAt.innerText = `A rejoint Retweet en ${moment(createdAt.getAttribute('date')).month(1).format('MMMM YYYY')}`;

if ((USER.id === PROFILE.id || USER.isAdmin) && !PROFILE.isDeleted) {
	const editContainer = document.getElementById('profile-editor-container');

	// Ouverture / Fermeture de l'éditeur de profil.
	const openBtn = document.getElementById('open-profile-editor');
	openBtn.addEventListener('click', () => editContainer.classList.add('visible'));
	closeBtn = editContainer.querySelector('#profile-editor-close');
	closeBtn.addEventListener('click', () => editContainer.classList.remove('visible'));

	const form = editContainer.querySelector('form');
	const sendButton = editContainer.querySelector('#profile-editor-save');
	const inputContainers = form.querySelectorAll('.text-input');
	sendButton.addEventListener('click', () => {
		// Vérification des longueurs des champs du profil.
		for (const elm of inputContainers) {
			const input = elm.querySelector('input');
			const limit = parseInt(elm.getAttribute('limit'));
			const content = input.value;
			if (content.length > limit)
				return;
			// Ajout aussi du préfixe http au site internet si besoin.
			if (input.name === 'website' && !/^(http|https):\/\//.test(content)) {
				input.value = `https://${content}`;
			}
		}
		form.submit();
	});

	// Affichage de l'avatar/bannière renseignée par l'utilisateur.
	const avatarInput = form.querySelector('input#avatar');
	const bannerInput = form.querySelector('input#banner');
	const onChange = e => {
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
}
if (!PROFILE.isDeleted && (USER.id !== PROFILE.id || (USER.id !== PROFILE.id && USER.isAdmin))) {
	// Le profil visité n'est pas celui de l'utilisateur connecté.
	// On affiche alors le bouton servant à suivre l'utilisateur dont on consulte le profil.
	const followToggle = document.querySelector('#follow-toggle');
	followToggle.addEventListener('click', async () => {
		const id = PROFILE.id;
		const action = followToggle.getAttribute('action');
		await fetch(`/api/${action}/${id}`);
		followToggle.setAttribute('action', action === 'follow' ? 'unfollow' : 'follow');
		followToggle.innerText = action === 'follow' ? 'Suivi' : 'Suivre';
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

const defaultList = document.querySelector('#profile-tweets');
defaultList.classList.add('visible');

const listSelectors = document.querySelectorAll('#profile-tweet-list-selector .select');

for (const elm of listSelectors) {
	elm.addEventListener('click', () => {
		const list = elm.id
		document.querySelector(`.tweet-list#profile-${list}`).classList.add('visible');
		document.querySelector(`.tweet-list:not(#profile-${list})`).classList.remove('visible');
		elm.classList.add('selected');
		document.querySelector(`.select:not(#${elm.id})`).classList.remove('selected');
	});
}