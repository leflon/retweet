const staticCacheName = 'twitter.paulleflon.fr';

self.addEventListener('push', (e) => {
	const data = e.data.json();
	console.log(e);
	self.registration.showNotification(data.title, {
		body: data.body,
		icon: data.icon,
		image: data.image,
		data: {
			url: data.url
		}
	});
});

self.addEventListener('notificationclick', e => {
	console.log(e);
	e.notification.close();
	e.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(clientList => {
		for (const client of clientList) {
			if (client.url === e.notification.data.url && 'focus' in client) {
				return client.focus();
			}
		}
		if (clients.openWindow) {
			return clients.openWindow(e.notification.data.url);
		}
	}));
});

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(staticCacheName)
		.then(function(cache) {
			return cache.addAll([
				'/',
			]);
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
			return response || fetch(event.request);
		})
	);
});