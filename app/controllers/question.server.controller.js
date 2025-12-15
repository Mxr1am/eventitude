const questions = require("../models/question.server.model")
const Joi = require("joi");
const userServerController = require("../models/user.server.model")
const isUserRegisteredForEvent = require ("../models/event.server.model")

const askQuestion = (req, res) => {
    const token = req.get('X-Authorization');
    const event_id = req.params.event_id;

    if (!token) {
        return res.status(401).json({ error_message: "User not authenticated" });
    }


    userServerController.getIdFromToken(token, (err, user_id) => {
        if (err || user_id === null) {
            return res.status(401).json({ error_message: "User not authenticated" });
        }

       
        const schema = Joi.object({
            question: Joi.string().required(),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error_message: error.details[0].message });
        }

        const question = req.body.question;

     
        questions.getEventCreator(event_id, (err, event) => {
            if (err) {
                return res.status(500).json({ error_message: "Server error" });
            }

            if (!event) {
                return res.status(404).json({ error_message: "Event not found" });
            }

            if (event.creator_id === user_id) {
                return res.status(403).json({ error_message: "You cannot ask questions on your own events" });
            }

            isUserRegisteredForEvent.isUserRegisteredForEvent(event_id, user_id, (err, isRegistered) => {
                if (err) {
                    return res.status(500).json({ error_message: "Server error" });
                }

                if (!isRegistered) {
                    return res.status(403).json({ error_message: "You cannot ask questions on events you are not registered for" });
                }

          
                questions.askQuestion(question, user_id, event_id, (err, question_id) => {
                    if (err) {
                        return res.status(500).json({ error_message: "Server error" });
                    }

                    return res.status(201).json({ question_id });
                });
            });
        });
    });
};


       


        const deleteQuestion = (req, res) => {
            const token = req.get('X-Authorization');
            const question_id = req.params.question_id;
        
            if (!token) {
                return res.status(401).json({ error_message: "User not authenticated" });
            }
        
          
            userServerController.getIdFromToken(token, (err, user_id) => {
                if (err || user_id === null) {
                    return res.status(401).json({ error_message: "User not authenticated" });
                }
        
                
                questions.deleteQuestion(question_id, user_id, (err, result) => {
                    if (err) {
                        return res.status(500).json({ error_message: "Server error" });
                    }
        
                    if (!result.success) {
                        return res.status(403).json({ error_message: result.message });
                    }
        
                    res.status(200).json({ message: "Question archived successfully" });
                });
            });
        };

        
       
        const upvoteQuestion = (req, res) => {
            const token = req.get('X-Authorization');
            const question_id = req.params.question_id;
        
            if (!token) {
                return res.status(401).json({ error_message: "User not authenticated" });
            }
        
           
            userServerController.getIdFromToken(token, (err, user_id) => {
                if (err || user_id === null) {
                    return res.status(401).json({ error_message: "User not authenticated" });
                }
        
                
                questions.upvoteQuestion(question_id, user_id, (err, done) => {
                    if (err) {
                        return res.status(500).json({ error_message: "Server error" });
                    }
        
                    if (!done.success) {
                        if (done.reason === "already_voted_or_not_found") {
                            return res.status(403).json({ error_message: "You have already voted on this question" });
                        }
                        if (done.reason === "not_found") {
                            return res.status(404).json({ error_message: "Question not found" });
                        }
                    }
        
                    res.sendStatus(200);
                });
            });
        };
       



const downvoteQuestion = (req, res) => {
    const token = req.get('X-Authorization'); 
    const question_id = req.params.question_id; 

    if (!token) {
        return res.status(401).json({ error_message: "User not authenticated" });
    }


    userServerController.getIdFromToken(token, (err, user_id) => {
        if (err || user_id === null) {
            return res.status(401).json({ error_message: "User not authenticated" });
        }

        
        questions.downvoteQuestion(question_id, user_id, (err, done) => {
            if (err) {
                return res.status(500).json({ error_message: "Server error" });
            }

            if (!done.success) {
                
                return res.status(403).json({ error_message: done.message });
            }

           
            res.sendStatus(200); 
        });
    });
};



module.exports = {

    askQuestion,
    deleteQuestion,
    upvoteQuestion,
    downvoteQuestion,
    // deleteQuestion,
}