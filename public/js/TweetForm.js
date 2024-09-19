for (const form of document.querySelectorAll('form.tweet-form')) {
	// Vérification de la longueur du tweet.
	form.addEventListener('submit', e => {
		e.preventDefault();
		const content = form.querySelector('input[name=\'content\']').value.trim();
		if (content.length > 0 && content.length <= 280)
			form.submit();
		else
			alert('Le contenu doit être compris entre 1 et 280 caractères.');
	});
	// Prévisualisation de l'image du tweet.
	form.querySelector('input[type=\'file\']').addEventListener('change', e => {
		const file = e.target.files[0];
		const container = form.querySelector('.image-preview-container'); 
		container.innerHTML = '';
		if (file) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				const img = document.createElement('img');
				img.src = reader.result;
				container.appendChild(img);
			});
			reader.readAsDataURL(file);
		}
	});
}