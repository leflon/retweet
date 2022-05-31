const model = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Enter'];
let input = [];
document.addEventListener('keydown', ({key}) => {
	if (key === model[input.length])
		input.push(key);
	else
		input = [];
	if (input.length === model.length) {
		document.body.classList.toggle('epilepsie');
		input = [];
	}

});