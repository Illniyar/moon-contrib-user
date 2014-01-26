var expect = chai.expect
describe("authentication service",function(){
    beforeEach(angular.mock.module('user.authentication',function(authenticationProvider){
        authenticationProvider.registerAuthenticator("success",function(authInfo,cb){
            setTimeout(function(){cb(null,{authInfo:authInfo,success:true})},0)
        })
        authenticationProvider.registerAuthenticator("failure",function(authInfo,cb){
            setTimeout(function(){cb(new Error("don't log in"))},0)
        })
    }))
    it("should login authenticated user",function(done){
        inject(function(authentication,$httpBackend){
            $httpBackend.expectGET("/api/v1/users/me")
                .respond({
                    result:"yay!"
                })
            authentication.authenticate("success",{text:"new user"})
                .then(function(userInfo){
                    expect(userInfo.authInfo.text).to.equal("new user")
                    expect(authentication.user.authInfo.text).to.equal("new user")
                    expect(authentication.isAuthenticated).to.equal(true)
                    done()
                },done)
        })
    })
})
