// Réaffecte la méthode render afin de toujours envoyer les données de l'utilisateur dans les vues.
module.exports = async function(req, res, next) {
	const nativeRender = res.render;
	res.render = (view, data) => {
		// La fonction render classique requiert  `res` comme objet `this`.
		nativeRender.call(res, view, {...data, user: req.user});
	};
	next();
};