// Si il y'a une longue discussion avant le tweet selectionné,
// On scrolle jusqu'à celui-ci.
// L'utilisateur sait alors quel tweet il cherche et peut toujours
// accéder au reste de la discussion en défilant vers le haut.
const mainTweet = document.querySelector('.tweet.full');
window.scrollTo(0, mainTweet.offsetTop);