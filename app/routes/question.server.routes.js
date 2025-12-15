const questions = require("../controllers/question.server.controller")
const auth = require('../middleware/authentication.middleware')

console.log(questions);

module.exports = function(app){

    app.route("/event/:event_id/question")
     .post(auth.isAuthenticated, questions.askQuestion);
    

    app.route("/question/:question_id")
    .delete(auth.isAuthenticated, questions.deleteQuestion);
    
    app.route("/question/:question_id/vote")
    .post(questions.upvoteQuestion)
    .delete(questions.downvoteQuestion);
}