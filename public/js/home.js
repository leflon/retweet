const actionButtons = document.querySelectorAll('.tweet-action');

for (const btn of actionButtons) {
	btn.addEventListener('click', async ({target}) => {
		const tweet = target.getAttribute('tweet');
		const action = target.getAttribute('action');
		const undo = target.getAttribute('undo') === 'true';
		if (action === 'like') {
			let res = await fetch(`/api/tweets/${undo ? 'unlike' : 'like'}/${tweet}`);
			res = await res.json();
			target.setAttribute('undo', !undo);
		}
		if (action === 'retweet') {
			let res = await fetch(`/api/tweets/${undo ? 'unretweet' : 'retweet'}/${tweet}`);
			res = await res.json();
			console.log(res);
			target.setAttribute('undo', !undo);
		}
		if (action === 'delete') {
			let res = await fetch(`/api/tweets/delete/${tweet}`);
			res = await res.json();
		}
	});
}


