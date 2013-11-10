var passport = require("passport"),
    moonshine = require("moonshine-js"),
    util = require("util")

function Strategy() {
    passport.Strategy.call(this);
    this.name = 'id';
}
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req) {
    var self = this;
    moonshine.db.models.User.findById(req.body.id,function(err,dbUser){
        if (err) self.error(err);
        if (!dbUser) self.fail(info);
        self.success(dbUser);
    })
}
module.exports.wrapup = function(cb){
    passport.use(new Strategy())
    cb()
}