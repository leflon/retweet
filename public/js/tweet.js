const tweets = document.querySelectorAll('.tweet');
for (const tw of tweets) {
	tw.addEventListener('click', e => {
		if (e.target.className === 'tweet-image') {
			tw.classList.add('fullscreen');
		}
		// Si on clique sur une zone inactive du tweet, on est redirigé vers la page complète du tweet.
		// On le fait seulement si le tweet n'est pas déjà affiché en pleine largeur.
		if (!tw.classList.contains('full') && ['left', 'right', 'tweet-heading', 'tweet-content', 'tweet-footer'].includes(e.target.className)) {
			location.href = `/tweet/${tw.id}`;
		}
	});

	const fullscreenClose = tw.querySelector('.tweet-image-fullscreen-close');
	if (fullscreenClose) {
		fullscreenClose.addEventListener('click', e => {
			tw.classList.remove('fullscreen');
		});
	}
}


const actionButtons = document.querySelectorAll('.tweet-action');

async function actionButtonListener({target}) {
	console.log('putani');
	const tweet = target.getAttribute('tweet');
	const action = target.getAttribute('action');
	const undo = target.getAttribute('undo') === 'true';
	let res;
	console.log(target);
	if (action === 'like') {
		res = await fetch(`/api/tweets/${undo ? 'unlike' : 'like'}/${tweet}`);
		res = await res.json();
		console.log(res);
		const targets = document.querySelectorAll(`.tweet-action.like[tweet='${tweet}']`);
		for (const target of targets) {
			target.querySelector('i').classList.toggle('fa-solid');
			target.querySelector('i').classList.toggle('fa-regular');
			target.setAttribute('undo', !undo);
			target.querySelector('.count').innerText = res.count;
			target.classList.toggle('active');
		}

	}
	if (action === 'retweet') {
		res = await fetch(`/api/tweets/${undo ? 'unretweet' : 'retweet'}/${tweet}`);
		res = await res.json();
		const targets = document.querySelectorAll(`.tweet-action.retweet[tweet='${tweet}']`);
		for (const target of targets) {
			target.setAttribute('undo', !undo);
			target.querySelector('.count').innerText = res.count;
			target.classList.toggle('active');
		}
		if (undo)
			document.querySelector(`.retweet[id='${tweet}']`).remove();
		else if (!('PROFILE' in window) || PROFILE.id === USER.id){
			const base = document.querySelector(`.tweet[id='${tweet}']`);
			const clone = base.cloneNode(true);
			clone.classList.add('retweet');
			const ref = clone.querySelector('.ref') || document.createElement('a');
			ref.href = `/profile/${USER.username}`;
			ref.className = 'ref';
			ref.innerHTML = `<i class="fa-solid fa-retweet"></i><span>${USER.displayName || `@${USER.username}`} a retweeté</span>`;
			clone.querySelector('.right').insertAdjacentElement('afterbegin', ref);
			clone.querySelector('.tweet-action.delete')?.addEventListener('click', actionButtonListener);
			clone.querySelector('.tweet-action.reply').addEventListener('click', actionButtonListener);
			clone.querySelector('.tweet-action.retweet').addEventListener('click', actionButtonListener);
			clone.querySelector('.tweet-action.like').addEventListener('click', actionButtonListener);
			document.querySelector('.tweet-list')?.insertAdjacentElement('afterbegin', clone);
		}
	}

	if (action === 'reply') {
		location.href = `/tweet/${tweet}`;
	}

	if (action === 'delete') {
		if (confirm('Supprimer le tweet ?')) {
			let res = await fetch(`/api/tweets/delete/${tweet}`);
			res = await res.json();
			document.getElementById(tweet).remove();
		}
	}
}

for (const btn of actionButtons) {
	btn.addEventListener('click', actionButtonListener);
}

const tweetTimes = document.querySelectorAll('.tweet-time');

for (const elm of tweetTimes) {
	const date = new Date(elm.getAttribute('date'));
	moment.locale('fr');
	elm.innerText = '• ' + moment(date).fromNow().replace('il y a', '');
	elm.setAttribute('title', moment(date).format('LLLL'));
}