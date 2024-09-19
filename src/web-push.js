const webpush = require('web-push');

const publicVapid = process.env.PUBLIC_VAPID_KEY;
const privateVapid = process.env.PRIVATE_VAPID_KEY;

module.exports = () => {
	webpush.setVapidDetails(
		'mailto:' + process.env.VAPID_EMAIL,
		publicVapid,
		privateVapid
	);
};