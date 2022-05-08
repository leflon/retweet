// Overrides the default render function to add the current user to the data passed in the view.
module.exports = async function(req, res, next) {
	const nativeRender = res.render;
	res.render = (view, data) => {
		// The usual render function needs `res` as `this`.
		nativeRender.call(res, view, {...data, user: req.user});
	};
	next();
};