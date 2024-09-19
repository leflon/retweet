// Réaffecte la méthode render afin de toujours envoyer les données de l'utilisateur dans les vues.
module.exports = async function(req, res, next) {
	const nativeRender = res.render;
	res.render = (view, data) => {
		// La fonction render classique requiert l'objet `res` comme objet `this`.
		nativeRender.call(res, view, {...data, user: req.user, vapidPublic: process.env.PUBLIC_VAPID_KEY});
	};
	next();
};