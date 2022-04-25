for (const form of document.querySelectorAll('form.new-tweet')) {
	form.addEventListener('submit', e => {
		e.preventDefault();
		const content = form.querySelector('.content').innerText;
		form.querySelector('input[name=\'content\']').value = content;
		if (content.length > 0 && content.length <= 280)
			form.submit();
		else
			alert(' 1 <= N <= 280');
	});
	form.querySelector('input[type=\'file\']').addEventListener('change', e => {
		const file = e.target.files[0];
		const container = form.querySelector('.media-preview-container'); 
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