
module.exports.authorizeByUserRef = function(fieldName) {
    if (!fieldName) fieldName = "user"
    return function(user,action,obj,change) {
        if (action == "view") {
            return obj[fieldName] == user.id
        } else if (action == "update") {
            return obj[fieldName] == user.id
        } else if (action == "create") {
            obj[fieldName] = user.id
            return true
        }
        return false;
    }
}
