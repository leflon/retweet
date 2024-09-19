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

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js', {
	  scope: '/',
	});
}

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
	.replace(/\-/g, '+')
	.replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
	outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

window.subscribe = async () => {
	if (!('serviceWorker' in navigator)) return;
	
	const registration = await navigator.serviceWorker.ready;
  if (await registration.pushManager.getSubscription() !== null)
	return;
	
	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID),
	});
	
  await fetch('/api/subscription', {
	method: 'POST',
	body: JSON.stringify(subscription),
	headers: {
	  'content-type': 'application/json',
	},
  });
}


const notifsAccept = document.querySelector('#notification-popup #accept');
const notifsDecline = document.querySelector('#notification-popup #decline');
const notifsContainer = document.querySelector('#notification-container');
const menuNotifs = document.querySelector('#main-menu #allow-push');
notifsDecline.addEventListener('click', () => {
	notifsContainer.remove();
	localStorage.setItem('PUSH_WAS_PROMPTED', 'true');
	menuNotifs.classList.add('visible');
});
notifsAccept.addEventListener('click',async () => {
	subscribe();
	notifsContainer.remove();
	localStorage.setItem('PUSH_WAS_PROMPTED', 'true');
});
menuNotifs.addEventListener('click', async () => {
	subscribe();
	menuNotifs.remove();
});

(async () => {

	const registration = await navigator.serviceWorker.ready;
	const pushAllowed = await registration.pushManager.getSubscription() !== null;
	const wasPrompted = localStorage.getItem('PUSH_WAS_PROMPTED') === 'true';

	if (!wasPrompted && !pushAllowed) {
		notifsContainer.classList.add('visible');
	} else {
		notifsContainer.remove();
		if (!pushAllowed) {
			menuNotifs.classList.add('visible');
		}
	}
})();

