(function(){
	function authenticatedOnly(loggedIn,authentication) {
		if (!loggedIn) authentication.doOnUnauthorizedAccess();
	}
    function notForAuthenticated(loggedIn,authentication){
        if (loggedIn)  authentication.redirectToNext()
    }
    function authenticationProvider() {
        var authenticators = {}
        this.registerAuthenticatior = function registerAuthenticatior(name,authenticator) {
            if (!authenticator) {
                authenticator = name;
                name = "default"
            }
            authenticators[name] = authenticator;
            if (!authenticators.default) {
                authenticators.default = authenticator
            }
        }
        this.setDefaultAuthenticator = function setDefaultAuthenticator(arg) {
            if (angular.isString(arg)) {
                authenticators.default = authenticators[arg]
            } else {
                authenticators.default = arg
            }
        }
        this.$get = [ '$location', '$q','$http','moonbridge','$rootScope',
            function ($location, $q,$http,moonbridge,$rootScope) {
            var authentication = {};
            var firstTimeUserDefer = $q.defer()
            var onSuccessQueue = $q.defer();
            var checkAuthPromise = null;
            authentication.user = firstTimeUserDefer.promise
            var performLogin = function(user) {
                firstTimeUserDefer.resolve(user)
                authentication.user = user
                authentication.isAuthenticated = true
                onSuccessQueue.resolve(user);
            }
            var performLogout = function() {
                authentication.user = undefined
                authentication.isAuthenticated = false
                checkAuthPromise = $q.when(false).promise
                onSuccessQueue = $q.defer()
            }
            authentication.checkAuthenticated = function(force){
                if (!force && checkAuthPromise) return checkAuthPromise;
                var deferred = $q.defer();
                moonbridge.one('users','me').get().then(function(user){
                    performLogin(user);
                    deferred.resolve(true)
                },function(response){
                    alreadyAuthenticated = false;
                    deferred.resolve(false)
                })
                checkAuthPromise = deferred.promise
                return checkAuthPromise;
            }
            authentication.authenticate = function (authenticator,authInfo) {
                if (!authInfo) {
                    authInfo = authenticator;
                    authenticator = "default"
                }
                var deferred = $q.defer();
                var isAuthenticatedDeferred = $q.defer();
                authenticators[authenticator](authInfo,function(err,userInfo){
                    if (err) return deferred.reject(err);
                    performLogin(userInfo)
                    deferred.resolve(userInfo)
                    $rootScope.$apply()
                });
                var loginPromise = deferred.promise;
                loginPromise.then(function(user){
                    isAuthenticatedDeferred.resolve(true)
                },function(err){
                    isAuthenticatedDeferred.resolve(false)
                    authentication.isAuthenticated = false
                })
                return loginPromise;
            };
            authentication.doOnUnauthorizedAccess = function() {
                authentication.nextLocation = $location.path();
                authentication.queue(function(){
                    authentication.redirectToNext()
                })
                $location.path(authentication.loginPagePath)
            }
            authentication.redirectToNext = function() {
                $location.path(authentication.nextLocation);
            }
            authentication.loginPagePath = "/login"
            authentication.nextLocation = "/"
            authentication.register = function (user,cb) {
                var deferred =$q.defer()
                moonbridge.all('users').post(user).then(function(newUser){
                    authentication.user = newUser
                    performLogin(newUser)
                    deferred.resolve(user);
                    if (cb)	cb(null,newUser);
                },function(response){
                    var err = new Error("could not add user- status:" + response.status + ". message:" + response.body )
                    deferred.reject(err)
                    if (cb) cb(err)
                })
                return deferred.promise;
            }
            authentication.logout = function(cb){
                var deferred =$q.defer()
                $http.post("/api/v1/users/logout/",{})
                .success(function (data, status, headers, config) {
                    performLogout()
                    authentication.redirectToNext()
                    deferred.resolve();
                    if(cb) cb(null)
                }).error(function (data, status) {
                    var err = new Error('status: ' + status + ';failed to logout because of:' + data);
                    deferred.reject(err)
                    if(cb) cb(err)
                });
                return deferred.promise;
            }
            authentication.queue = function (toQueue) {
                onSuccessQueue.promise.then(toQueue)
            }
            return authentication;
        }]
    }
	var authenticationModule = angular.module("user.authentication",["api.moonbridge"])
    authenticationModule.constant('authenticatedOnly',authenticatedOnly)
    authenticationModule.constant('notForAuthenticated',notForAuthenticated)
    authenticationModule.provider('authentication', authenticationProvider)

	authenticationModule.controller("AuthLoginCtrl",["$scope","authentication",function($scope,authentication) {
		$scope.authentication = authentication;
		$scope.user = {};
		$scope.state = "waiting"
		$scope.login = function() {
			$scope.state= "authenticating"
			$scope.$emit("auth.authstart")
			authentication.authenticate($scope.user).then(function(user){
				$scope.state= "authenticated"
				$scope.$emit("auth.authend",null,user);
			},function(err){
				$scope.state = "error"
				$scope.err =err
				$scope.$emit("auth.authend",err);
			});
		}; 
	}])
	authenticationModule.controller("AuthRegisterCtrl",["$scope","authentication",function($scope,authentication) {
		$scope.authentication = authentication;
		$scope.user = {};
		$scope.state = "waiting"
		$scope.register = function() {
			$scope.state= "registering"
			$scope.$emit("auth.registerstart")
			authentication.register($scope.user).then(function(user){
				$scope.state= "registered"
				$scope.$emit("auth.registerend",null,user);
			},function(err){
				$scope.state = "error"
				$scope.err =err
				$scope.$emit("auth.registerend",err);
			});
		}; 
	}])

    authenticationModule.controller("AuthLogoutCtrl",["$scope","authentication",function($scope,authentication) {
        $scope.authentication = authentication;
        $scope.user = {};
        $scope.state = "waiting"
        $scope.logout = function() {
            $scope.state= "logging out"
            $scope.$emit("auth.logoutstarted")
            authentication.logout().then(function(){
                $scope.state= "logged out"
                $scope.$emit("auth.logoutended",null);
            },function(err){
                $scope.state = "error"
                $scope.err =err
                $scope.$emit("auth.logoutended",err);
            });
        };
    }])
    authenticationModule.run(["$rootScope", "$q","authentication",function($rootScope, $q,authentication){
        function onRouteChange(event, next){
            if (next.permission && angular.isFunction(next.permission)) {
                var waitForMe = $q.defer()
                if (!next.resolve) next.resolve = {}
                next.resolve.loggedIn = waitForMe.promise;
                authentication.checkAuthenticated().then(function(loggedIn){
                    next.permission(loggedIn,authentication)
                    waitForMe.resolve(true)
                })
            }
        }
        $rootScope.$on('$stateChangeStart', onRouteChange) //ui-router
        $rootScope.$on('$routeChangeStart', onRouteChange) //standard-router
        authentication.checkAuthenticated()
    }])
})()