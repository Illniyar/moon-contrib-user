var moonshine = require("moonshine-js")
var settings = moonshine.settings
var logger = moonshine.logFactory()
var passport = require("passport");

module.exports.pre = function(cb){
    registerService()
    var validationErr = validateSettings(settings);
    if (validationErr) {
        return cb(validationErr);
    }
    configureExpress(moonshine.server.app)
    configureSerialization();
    configureApiAuthentication()
    configureAuthorizationOnResources();
    cb()
}

function registerService() {
    moonshine.registerService("user",{
        auth: {
            addStrategy:passport.use,
            authenticate:passport.authenticate.bind(passport),
            native:passport
        }
    })
}
function configureExpress(app) {
        var express = moonshine.server.native
		app.configure(function(){
		app.use(express.cookieParser(settings.COOKIE_SECRET_TOKEN));
		app.use(express.bodyParser());
		app.use(express.session({secret: settings.SESSION_SECRET_TOKEN}))
		app.use(passport.initialize());
		app.use(passport.session());
	})
}
function validateSettings(settings) {
	if (!settings.SESSION_SECRET_TOKEN) {
		return Error("authentication requires a secret token for session serialization. if you are running a production enviornment, set the SESSION_SECRET_TOKEN setting")
	}
}
function getUser(req) {
    return req[settings.USER_REQUEST_PROPERTY_NAME]
}
function configureSerialization() {
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
	  moonshine.persistence.models.User.findById(id, function (err, user) {
		done(err, user);
	  });
	});
}
function authorizeApi(req,res,next){
    if (!req.isAuthenticated() || !getUser(req)) return res.send(401, "not authenticated");
    next();
}
function configureApiAuthentication(){
	for (var rName in moonshine.api.resourceOptions) {
		var rOptions = moonshine.api.resourceOptions[rName]
		var needsAuth = (settings.USER_REQUIRE_AUTH_BY_DEFAULT &&  rOptions.requireAuth !== false) //only an explicit false should prevent authentication
						|| (!settings.USER_REQUIRE_AUTH_BY_DEFAULT &&  rOptions.requireAuth !== true) //only an explicit true should prevent authentication
		if (needsAuth) {
			var resource = moonshine.api.resources[rName]
			resource.query(authorizeApi)
		}
		
	}
}
function configureAuthorizationOnResources(){
	for (var rName in moonshine.api.resourceOptions) {
		var rOptions = moonshine.api.resourceOptions[rName]
		var needsAuth = (settings.USER_REQUIRE_AUTH_BY_DEFAULT &&  rOptions.requireAuth !== false) //only an explicit false should prevent authentication
						|| (!settings.USER_REQUIRE_AUTH_BY_DEFAULT &&  rOptions.requireAuth !== true) //only an explicit true should prevent authentication
		var resource = moonshine.api.resources[rName]
		resource.documents("get",function(req,res,next){
			var Model = request.app.get('model');
			if (!Model.authorize) return next()
			if (typeof request.baucis.documents == 'number') Model.authorize(getUser(req),"count",null,req.app.getFindByConditions(req));
			var objs = [].concat(documents);
			for (var i in objs) {
				var obj = objs[i];
				if (!Model.authorize(getUser(req),"view",obj)){
					res.send(403,"not authorized")
					return;
				}
			}
			next()
		})	
		resource.query("instance","put",function(req,res,next){
			var Model = request.app.get('model');
			if (!Model.authorize) return next()
			req.baucis.query.exec(function(err,doc){
				if (err) return next(err)
				req.baucis.query.exec = function(cb){process.nextTick(function(){cb(err,doc)});};
				if (!Model.authorize(getUser(req),"update",doc,req.body)){
					res.send(403,"not authorized")
					return;
				}
				next()
			})
		})	
		resource.request("collection","post",function(req,res,next){
			var Model = req.app.get('model');
			if (!Model.authorize) return next()
			var objs = [].concat(req.body);
			for (var i in objs) {
				var obj = objs[i];
				if (!Model.authorize(getUser(req),"create",obj)){
					res.send(403,"not authorized")
					return;
				}
			}
			next()
		})	
	}
}