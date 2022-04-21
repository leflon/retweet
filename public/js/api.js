const like = async (id) => {
	const t = await fetch(`/api/tweets/like/${id}`);
	console.log(t);
};

const retweet = async (id) => {
	const t = await fetch(`/api/tweets/retweet/${id}`);
	console.log(t);
};
