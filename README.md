Moonshine user component
====================

Moon-contrib-user is a User and Authentication Component for [Moonshine](https://github.com/Illniyar/moonshine) using [passport.js](http://passportjs.org/).

###Moon-contrib-user
* __*Service*__:
 * __user__ : 
     * __addStrategy__: A function that allows adding a passport.js strategy (it's an alias for passport.use
     * __authenticate__: an alias for passport.authenticate
     * __native__ :  access the passport.js object directly
     * __getUser__(request): a function that given an express.js object return's the User object (useful for cases where the user object isn't named user)


* __*Applicable settings*__:
 * __SESSION_SECRET_TOKEN__: the secret token used to encrypt Sessions
 * __USER_REQUIRE_AUTH_BY_DEFAULT__: if true all REST resources are only available to authenticated users unless specified directly. if false, only resources that are specified are blocked to none authenticated user.
--defaults to true
 * __USER_REQUEST_PROPERTY_NAME__: the express.js request object proprty name that stores user info. --defaults to 'user'
 * __COOKIE_SECRET_TOKEN__: secret token to encrypt cookies.


* __*Resource options*__:
 * __requireAuth__: determines if a resource is only visible to authenticated users. (see also settings:USER_REQUIRE_AUTH_BY_DEFAULT)
 
* __*Entities*__:
 *__user__: a new, user entity has been added both as a model and a resource.
    *__"/users/me"__ : this route allows viewing the authenticated user's resource.
	*__"/users/logout"__: this route allows logging out for the authenticated user. This api takes no payload, and returns a 204 response.


* __*Model extensions*__:
 * __authorize__: you can add a static method to a model called _authorize_. All get/post/put requests on a resource for that model will first authorize using that method. 

   The method gets the following arguments:
    * _user_ - the user object.
    * _action_ - the type of action - "view","update" or "create"
    * _object_ - the object in question (a json object in case of view or create, and the actual object in update)
    * _change_ - a list of changes to be made (in case of update)
    
   The method should return a boolean value indicating if the user is authorized to perform this action.
 * __applyLimit__: you can add a static method to a model called _applyLimit_. If exists all REST requests to view a collection for the model will first go through that function to limit the returned object (usually done to limit a user to view only his own objects). 
   The method gets the following arguments:
    * _user_ - the user object.
    * _query_ - the Baucis query object to apply the limit on.


* __*Helper methods*__:
 * `require("moon-contrib-user").authorizeByUserRef` - a convienient factory method to create an authorize method that authorizes a user to act only on it's own object (assuming that object has a reference field called user).


* __*Angular modules*__:
 * __user.authentication__['/js/user.authentication.js'] : 
   * __routing permission__: user.authentication provides additional routing capabilities. If a route (or state if using ui.router) has a permission field then before a route change is made that function will be called with the user object to authenticate).
   
     If the user is not authenticated he will be redirected to the login route (and compliting the login will return him to the requested route).

     The permission function recieves two attributes:
      * _loggedIn_ - boolean value whether the user is logged in.
      * _authentication_ - the _authentication_ service. (see below)
        
        The authentication service has two special functions while in permission check- `redirectToNext()` - that redirects back to the route specified (or default) and `doOnUnauthorizedAccess()` that redirects to login.

    * __Constants__:
      * __authenticatedOnly__- a convieniance permission function that limits routes only to users who are authenticated.
      * __notForAuthenticated__ - a convieniance permission function that doesn't allow a route to be viewed by authenticated users.
     
    * __Services__ :
      * __authenticationProvider__:
       * _registerAuthenticator_(name,authenticator): registers a new authenticator with the given name.
       * _setDefaultAuthenticator_(name/function): sets the authenticator as the default authenticator by name or reference.
      * __authenticaton__:
       * __checkAuthenticated__(force): checks if the user is authenticated. returns a promise for a boolean value.
       * __authenticate__(authenticatorName,authInfo): tries to authenticate the user with the given authenticator (authInfo is provided for authenticatorUse)
       * __loginRoute__: the default route for login (if a user tries to access an authenticated only route and is redirected). --defaults to '/login'
       * __register__(userInfo,callback): used to register a new user. automatically logs user in.  userInfo must contain all info needed for user registration.
       * __logout__(callback): logs user out.
    * __Controllers__ :
      * __AuthLoginCtrl__:   
      * __AuthRegisterCtrl__:
      * __AUTHLogoutCtrl__:
    
