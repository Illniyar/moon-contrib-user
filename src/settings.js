module.exports.config = function(settings) {

	//local auth settings
	settings.SESSION_SECRET_TOKEN = settings.SESSION_SECRET_TOKEN || "this should be changed in production"

	//general settings
	settings.USER_REQUIRE_AUTH_BY_DEFAULT = true
	settings.USER_ALLOW_NEW_REGISTRATION = true
    settings.USER_REQUEST_PROPERTY_NAME = "user"
    settings.COOKIE_SECRET_TOKEN =  settings.COOKIE_SECRET_TOKEN || "this should also be changed"
}
