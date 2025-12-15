const users = require("../controllers/user.server.controller")
const auth = require('../middleware/authentication.middleware')

console.log(users); 


module.exports = function(app){
    app.route("/users")
    .post(users.create_account);

    app.route("/login")
    .post(users.login);

    app.route("/logout")
    .post(auth.isAuthenticated, users.logout);
}