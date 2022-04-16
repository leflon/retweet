// Overrides the default render function to add the current user to the data passed in the view.
module.exports = async function(req, res, next) {
	const nativeRender = res.render;
	let cleanUser = {}; // User object without sensitive data.
	if (req.user) {
		cleanUser = {
			avatarId: req.user.avatarId,
			bannerId: req.user.bannerId,
			createdAt: req.user.createdAt,
			displayName: req.user.displayName,
			id: req.user.id,
			isAdmin: req.user.isAdmin,
			isSuspended: req.user.isSuspended,
			username: req.user.username,
		};
	}
	res.render = (view, data) => {
		// The usual render function needs `res` as `this`.
		nativeRender.call(res, view, {...data, user: cleanUser});
	};
	next();
};