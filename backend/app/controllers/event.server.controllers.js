const events = require("../models/event.server.model")
const Joi = require("joi");
const userServerController = require("../models/user.server.model")

const createEvent = (req, res) => {
    let token = req.get('X-Authorization');

    userServerController.getIdFromToken(token, (err, id) => {
        if (err || id === null) {
            console.log("User not authenticated");
        }
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        start: Joi.number().integer().required(),
        close_registration: Joi.number().integer().required(),
        max_attendees: Joi.number().integer().required(),
    });

    const {error} = schema.validate(req.body);
    if(error)
        return res.status(400).json({error_message: error.details[0].message});
    let event = Object.assign({}, req.body);

    let date = Date.now();
    if(req.body.start <= date){
        return res.status(400).send({ error_message : "event date must be in future"})
    }

    if(req.body.start <= req.body.close_registration){
        return res.status(400).send({ error_message: "registration date must close before start date"})
    }

    events.create_event(event, id, (err, id) => {

        
        if (err === 400) {
            return res.status(400).json({ error_message});
        } 
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }

        console.log(id);
        return res.status(201).send({event_id: id})
    });
});

};

const getEvent = (req, res) => {
 
    let token = req.get("X-Authorization");
    let event_id = req.params.event_id;
 
    userServerController.getIdFromToken(token, (err, id) => {
        if (err || id === null) {
            console.log("User not authenticated");
        }
 
     
        events.getEvent(event_id, id, (err, results) => {
            if (err === 404){
               
                return res.sendStatus(404);
            }
            if (err){
                console.log(err)
             return res.sendStatus(500);
            }
            return res.status(200).send(results);
 
           
        })
    });
}



const updateEvent = (req, res) => {
    let token = req.get('X-Authorization');
    let event_id = req.params.event_id;

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error_message: 'Request body cannot be empty' });
    }

   
    userServerController.getIdFromToken(token, (err, user_id) => {
        if (err || user_id === null) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        
        const schema = Joi.object({
            name: Joi.string().optional(),
            description: Joi.string().optional(),
            location: Joi.string().optional(),
            start: Joi.number().integer().optional(),
            close_registration: Joi.number().integer().optional(),
            max_attendees: Joi.number().integer().optional(),
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error_message: error.details[0].message });
        }

        let event = req.body;

      
        events.getEventById(event_id, (err, existingEvent) => {
            if (err) {
                console.error("Error during event lookup:", err);
                return res.status(500).json({ error_message: "Server error, please try again later." });
            }

           
            if (!existingEvent) {
                return res.status(404).json({ error_message: "Event not found" });
            }

           
            if (existingEvent.creator_id !== user_id) {
                return res.status(403).json({ error_message: "You can only update your own events" });
            }

           
            events.updateEvent(event_id, event, (err, result) => {
                if (err) {
                    console.error("Error during event update:", err);
                    return res.status(500).json({ error_message: "Server error, please try again later." });
                }

                return res.sendStatus(200);
                
            });
        });
    });
};


const attendEvent = (req, res) => {
    const token = req.get('X-Authorization');
    const event_id = req.params.event_id;

    if (!token) {
        return res.status(401).json({ error_message: "User not authenticated" });
    }


    userServerController.getIdFromToken(token, (err, user_id) => {
        if (err || user_id === null) {
            return res.status(401).json({ error_message: "User not authenticated" });
        }

      
        events.getEventById(event_id, (err, event) => {
            if (err) {
                return res.status(500).json({ error_message: "Server error" });
            }

            if (!event) {
                return res.status(404).json({ error_message: "Event not found" });
            }

           
            events.isUserRegisteredForEvent(event_id, user_id, (err, row) => {
                if (err) {
                    return res.status(500).json({ error_message: "Server error" });
                }

                if (row) {
                    return res.status(403).json({ error_message: "You are already registered for this event" });
                }

            
                events.getAttendeesCount(event_id, (err, count) => {
                    if (err) {
                        return res.status(500).json({ error_message: "Server error" });
                    }

                    if (count >= event.max_attendees) {
                        return res.status(403).json({ error_message: "Event is at capacity" });
                    }

                    const currentTime = Date.now();
                    if (currentTime > event.close_registration) {
                        return res.status(403).json({ error_message: "Registration is closed" });
                    }

                 
                    events.attendEvent(event_id, user_id, (err, result) => {
                        if (err) {
                            return res.status(500).json({ error_message: "Server error" });
                        }

                        return res.sendStatus(200);
                    });
                });
            });
        });
    });
};



const deleteEvent = (req, res) => {
    const token = req.get('X-Authorization');
    const event_id = req.params.event_id;

    if (!token) {
        return res.status(401).json({ error_message: "User not authenticated" });
    }

   
    userServerController.getIdFromToken(token, (err, user_id) => {
        if (err || user_id === null) {
            return res.status(401).json({ error_message: "User not authenticated" });
        }

        
        events.deleteEvent(event_id, user_id, (err, result) => {
            if (err) {
                return res.status(500).json({ error_message: "Server error" });
            }

            if (!result.success) {
                return res.status(403).json({ error_message: result.message });
            }

            res.sendStatus(200);
           
        });
    });
};


const searchEvent = (req,res) => {

    let q = req.query.q;
    let limit = req.query.limit;
    let offset = req.query.offset;

    if (q === null || !q || q === undefined){
        q ="";
    }

    if (!limit || limit == null ) {
        limit = 20;
    }

    if(!offset || offset == null){
        offset = 0;
    }

    events.searchEvent(q, limit, offset, (err, events) => {

        if(err) {
            console.log(err)
            return res.sendStatus(500);
        }

        console.log("Here")
        return res.status(200).send(events);
    })
};

module.exports = {
    createEvent,
    getEvent,
    updateEvent,
    attendEvent,
    deleteEvent,
    searchEvent,
};

