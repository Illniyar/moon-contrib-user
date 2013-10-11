module.exports.config = function(settings) {

	// you shuold provide your own token in production settings.
	// this makes sure an error is thrown in production settings if no secret is set
	settings.SESSION_SECRET_TOKEN = null 
}
