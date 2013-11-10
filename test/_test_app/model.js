var moonshine = require("moonshine-js"),
    Schema = moonshine.db.Schema

var Thing = moonshine.db.getSchema("Thing");

Thing.add({
    text:String,
    user:{type:Schema.ObjectId,ref:"User"}
})
Thing.statics.authorize = function(user,action,obj,change) {
    if (action == "view") {
        return obj.user == user.id
    } else if (action == "update") {
        return obj.user == user.id
    } else if (action == "create") {
        obj.user = user.id
        return true
    }
    return false;
}
