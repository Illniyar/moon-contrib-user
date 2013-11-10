var request = require("superagent")
var moonshine = require("moonshine-js")
var helpers = require("moonshine-js/helpers/test")
var assert = require("assert")

describe("user",function(){
    before(function(done){
        moonshine.runCommand("runserver",[require.resolve("./_test_app")])
            .then(done,done)
    })
    afterEach(helpers.clearDB)

    it("should be able to log in",function(done){
        var user = moonshine.db.models.User()
        user.save(function(){
            request.post(helpers.apiRoot+"users/login/")
                .send({id:user.id})
                .end(function(err,res){
                    if (err) return done(err)
                    assert.equal(res.status,200)
                    assert.equal(res.body._id,user.id)
                    done()
                })
        })

    })

    describe("logged in",function(){
        var user = null;
        var agent = null;
        beforeEach(function(done){
            user = moonshine.db.models.User()
            user.save(function(){
                agent = request.agent()
                agent.post(helpers.apiRoot+"users/login/")
                    .send({id:user.id})
                    .end(function(err,res){
                        if (err) return done(err)
                        setTimeout(done,0)   //agent saves cookie asynchroniously
                    })
            })
        })

        it("should show user info",function(done){
            agent.get(helpers.apiRoot+"users/me/")
                .end(function(err,res){
                    if (err) return done(err)
                    assert.equal(res.status,200)
                    assert.equal(res.body._id,user.id)
                    done()
                })
        })
        it("should allow logging out",function(done){
            agent.post(helpers.apiRoot+"users/logout/")
                .end(function(err,res){
                    if (err) return done(err)
                    agent.get(helpers.apiRoot+"users/me/")
                        .end(function(err,res){
                            if (err) return done(err)
                            assert.equal(res.status,401)
                            done()
                        })
                })
        })
        describe("things",function(){
            var otherUser = null;
            var myThing = null;
            var otherThing = null;

            beforeEach(function(done){
                myThing =moonshine.db.models.Thing({
                    text:"the text",
                    user:user
                })
                myThing.save(function(err){
                    if (err) return done(err)
                    otherUser = moonshine.db.models.User()
                    otherUser.save(function(err){
                        if (err) return done(err)
                        otherThing =moonshine.db.models.Thing({
                            text:"the text",
                            user:otherUser
                        })
                        otherThing.save(function(err){
                            if (err) return done(err)
                            done()
                        })
                })
            })

            })
            it("should allow access to own",function(done){
                agent.get(helpers.apiRoot+"things/" + myThing.id+ "/")
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,200)
                        assert.equal(res.body._id,myThing.id)
                        assert.equal(res.body.text,"the text")
                        done()
                    })
            })
            it("should not allow access to other's",function(done){
                agent.get(helpers.apiRoot+"things/" + otherThing.id+ "/")
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,403)
                        done()
                    })
            })
            it("should allow updating own",function(done){
                agent.put(helpers.apiRoot+"things/" + myThing.id+ "/")
                    .send({text:"changed text"})
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,200)
                        assert.equal(res.body.text,"changed text")
                        moonshine.db.models["Thing"].findById(myThing.id,function(err,dbThing){
                            if (err) return done(err)
                            assert.equal(dbThing.text,"changed text")
                            done()
                        })
                    })
            })
            it("should not allow updating other's",function(done){
                agent.put(helpers.apiRoot+"things/" + otherThing.id+ "/")
                    .send({text:"changed text"})
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,403)
                        moonshine.db.models["Thing"].findById(otherThing.id,function(err,dbThing){
                            if (err) return done(err)
                            assert.equal(dbThing.text,"the text")
                            done()
                        })
                    })
            })
            it("should allow posting new Thing",function(done){
                agent.post(helpers.apiRoot+"things/")
                    .send({
                        "text":"different text"
                    })
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,201)
                        assert.ok(res.headers.location)
                        agent.get(helpers.httpRoot + res.headers.location)
                            .end(function(err,res){
                                assert.equal(res.body.user,user.id)
                                assert.equal(res.body.text,"different text")
                                moonshine.db.models["Thing"].findById(res.body._id,function(err,dbThing){
                                    if (err) return done(err)
                                    assert.equal(dbThing.text,"different text")
                                    done()
                                })
                            })

                    })
            })
            it("should override passing user id when creating new thing",function(done){
                agent.post(helpers.apiRoot+"things/")
                    .send({
                        "text":"different text",
                        "user":otherUser.id
                    })
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,201)
                        assert.ok(res.headers.location)
                        agent.get(helpers.httpRoot + res.headers.location)
                            .end(function(err,res){
                                assert.equal(res.body.user,user.id)
                                assert.equal(res.body.text,"different text")
                                moonshine.db.models["Thing"].findById(res.body._id,function(err,dbThing){
                                    if (err) return done(err)
                                    assert.equal(dbThing.text,"different text")
                                    done()
                                })
                            })

                    })
            })
            it("should allow access to all one's things",function(done){
                var secondThing = moonshine.db.models.Thing({
                    text:"second text",
                    user:user
                })
                secondThing.save(function(err){
                    if (err) return done(err)
                    agent.get(helpers.apiRoot+"things/?conditions=" + JSON.stringify({user:user.id}))
                        .end(function(err,res){
                            if (err) return done(err)
                            assert.equal(res.status,200)
                            assert.equal(res.body.length,2)
                            assert.equal(res.body[0]._id,myThing.id)
                            assert.equal(res.body[1]._id,secondThing.id)
                            done()
                        })
                })
            })
            it("should prevent access to other's things in list",function(done){
                agent.get(helpers.apiRoot+"things/")
                    .end(function(err,res){
                        if (err) return done(err)
                        assert.equal(res.status,403)
                        done()
                    })
            })
        })
    })
})
