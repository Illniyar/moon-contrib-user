var moonshine = require("moonshine-js"),
    api = moonshine.api;

var resource = api.resources.User;

resource.post("/login/",moonshine.user.auth.authenticate('id'),function(req,res){
    res.json(req.user)
})

var ThingResource = api.createResource("Thing",{singular:"Thing",requireAuth:true})
