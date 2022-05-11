const textInputs = document.querySelectorAll('.text-input');
for (const elm of textInputs) {
	const input = elm.querySelector('input[type=\'text\'], input[type=\'password\']') || elm.querySelector('.textarea');
	// Possibilité de voir son mot de passe en clair
	if (input.type === 'password') {
		const eyeContainer = elm.querySelector('.text-input-eye');
		eyeContainer.addEventListener('click', () => {
			eyeContainer.classList.toggle('open');
			input.type = input.type === 'password' ? 'text' : 'password';
		});
	}
	// Prise en charge d'un div contentEditable, qui porte la classe textarea
	// On s'en sert car les <textarea> ont des comportements bizarres
	if (input.className === 'textarea') {
		// Pour l'envoi du formulaire, un input caché est créé avec le div contentEditable.
		// On met à jour sa valeur dès que l'utilisateur tape dans le div.
		const actualInput = elm.querySelector(`input#${input.getAttribute('data-name')}`);
		input.addEventListener('input', e => {
			actualInput.value = e.target.innerText;
		});
		// En cas de copier-coller dans le div, il peut y avoir de la mise en forme sur le texte collé.
		// Cela se traduit par du html collé dans le div, qu'on ne veut pas ici.
		// On doit donc empêcher l'exécution du copier-coller et le réaliser nous-même
		// En prenant soin de supprimer la mise en forme.
		input.addEventListener('paste', e => {
			e.preventDefault();
			// On récupère le text collé sans la mise en forme depuis le presse-papier
			const text = e.clipboardData.getData('text/plain');
			// On insère manuellement le texte dans le div
			// execCommand est déprécié mais il n'y a a priori pas d'autre solution
			document.execCommand('insertText', false, text);
			// On exécute ensuite l'événement input pour mettre à jour la valeur de l'input caché
			input.dispatchEvent(new Event('input'));
		});
	}
	// Affichage de la limite de caractères
	// Ce script n'affecte que l'affichage de la limite,
	// Il faut vérifier la validité du contenu du champ lors de l'envoi du formulaire.
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