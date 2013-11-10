var moonshine = require("moonshine-js"),
	settings = moonshine.settings,
    auth = moonshine.user.auth,
	api = moonshine.api;

api.createResource("User",{singular:"User",requireAuth:false})
var resource = api.resources.User;

resource.documents("collection","post",function(req,res,next){
	var user =req.baucis.documents;
	req.login(user,function(err){
		next()
	})
})	
resource.get("/me",function(req,res,next){
	if (req.isAuthenticated() && auth.getUser(req)){
		res.json(auth.getUser(req));
	} else {
		res.send(401,"not authenticated");
	}
})
resource.post("/logout",function(req,res,next){
    if (req.isAuthenticated() && auth.getUser(req)){
        req.logout()
        res.send(204,"logged out")
    } else {
        res.send(401,"not authenticated");
    }
})