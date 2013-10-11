var moonshine = require("moonshine-js"),
	settings = moonshine.settings,
	api = moonshine.api;

api.createResource("User",{singular:"user",requireAuth:false})
var resource = api.resources.User;

resource.documents("collection","post",function(req,res,next){
	var user =req.baucis.documents;
	req.login(user,function(err){
		next()
	})
})	
resource.get("/me",function(req,res,next){
	if (req.isAuthenticated() && req.user){
		res.json(req.user);
	} else {
		res.send(401,"not authenticated");
	}
})
resource.post("/logout",function(req,res,next){
    if (req.isAuthenticated() && req.user){
        req.logout()
        res.send(204)
    } else {
        res.send(401,"not authenticated");
    }
})