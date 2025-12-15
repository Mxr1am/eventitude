const db = require('../../database');

const create_event = (event, creator_id, done) => {
    const sql = `INSERT INTO events (name, description, location, start_date, close_registration, max_attendees, creator_id) VALUES (?, ?, ?, ?, ?, ?,?)`;
    const values = [event.name, event.description, event.location, event.start, event.close_registration, event.max_attendees, creator_id];

    db.run(sql, values, function (err) {
        
        if (err) return done(err);

           
        return done(null, this.lastID); 
    });
};


const getEvent = (event_id, logged_in_user_id, done) => {
    const sqlEvent = `
        SELECT
            e.event_id,
            e.name,
            e.description,
            e.location,
            e.start_date,
            e.close_registration,
            e.max_attendees,
            e.creator_id,
            c.first_name AS creator_first_name,
            c.last_name AS creator_last_name,
            c.email AS creator_email
        FROM events e
        JOIN users c ON e.creator_id = c.user_id
        WHERE e.event_id = ?;
    `;

    db.get(sqlEvent, [event_id], (err, eventDetails) => {
        if (err) return done(err);
        if (!eventDetails) {
            return done(404); 
        }

        
        const sqlAttendees = `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM attendees a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.event_id = ?;
        `;

        const sqlQuestions = `
            SELECT
                q.question_id,
                q.question,
                q.asked_by,
                q.votes,
                u.first_name,
                u.last_name,
                u.email
            FROM questions q
            JOIN users u ON q.asked_by = u.user_id
            WHERE q.event_id = ?;
        `;

        let attendees = [];
        db.each(sqlAttendees, [event_id], (err, attendee) => {
            if (err) return done(err);
            attendees.push({
                user_id: attendee.user_id,
                first_name: attendee.first_name,
                last_name: attendee.last_name,
                email: attendee.email,
            });
        }, () => {
           
            attendees.push({
                user_id: eventDetails.creator_id,
                first_name: eventDetails.creator_first_name,
                last_name: eventDetails.creator_last_name,
                email: eventDetails.creator_email,
            });

            
            let questions = [];
            db.each(sqlQuestions, [event_id], (err, question) => {
                if (err) return done(err);
                questions.push({
                    question_id: question.question_id,
                    question: question.question,
                    asked_by: {
                        user_id: question.asked_by,
                        first_name: question.first_name,
                        last_name: question.last_name,
                        email: question.email,
                    },
                    votes: question.votes,
                });
            }, () => {
                
                const to_return = {
                    event_id: eventDetails.event_id,
                    creator: {
                        creator_id: eventDetails.creator_id,
                        first_name: eventDetails.creator_first_name,
                        last_name: eventDetails.creator_last_name,
                        email: eventDetails.creator_email,
                    },
                    name: eventDetails.name,
                    description: eventDetails.description,
                    location: eventDetails.location,
                    start_date: eventDetails.start_date,
                    close_registration: eventDetails.close_registration,
                    max_attendees: eventDetails.max_attendees,
                    number_attending: attendees.length, 
                    questions: questions,
                };

                to_return["number_attending"] = attendees.length;

                
                console.log(logged_in_user_id, eventDetails.creator_id);

                
                if (logged_in_user_id && logged_in_user_id === eventDetails.creator_id) {
                    to_return["attendees"] = attendees;
                }

                return done(null, to_return);
            });
        });
    });
};






const deleteEvent = (event_id, user_id, done) => {
    const sql = `
        UPDATE events
        SET close_registration = -1
        WHERE event_id = ? AND creator_id = ?;
    `;
    const params = [event_id, user_id];

    db.run(sql, params, function (err) {
        if (err) {
            return done(err); 
        }
        if (this.changes === 0) {
            
            return done(null, { success: false, message: "You canonly delete your own events" });
        }
        done(null, { success: true, changes: this.changes }); 
    });
};


    const updateEvent = (event_id, event, done) => {
        
        const getEventQuery = 'SELECT * FROM events WHERE event_id = ?';
        
        db.get(getEventQuery, [event_id], (err, existingEvent) => {
            if (err) {
                return done(err); 
            }
    
            if (!existingEvent) {
                return done(new Error('Event not found')); 
            }
    
           
            const updatedEvent = {
                name: event.name || existingEvent.name,
                description: event.description || existingEvent.description,
                location: event.location || existingEvent.location,
                start: event.start || existingEvent.start,
                close_registration: event.close_registration || existingEvent.close_registration,
                max_attendees: event.max_attendees || existingEvent.max_attendees
            };
    
           
            const updateEventQuery = `
                UPDATE events
                SET name = ?, description = ?, location = ?, start_date = ?, close_registration = ?, max_attendees = ?
                WHERE event_id = ?
            `;
    
            
            db.run(updateEventQuery, [
                updatedEvent.name,
                updatedEvent.description,
                updatedEvent.location,
                updatedEvent.start,
                updatedEvent.close_registration,
                updatedEvent.max_attendees,
                event_id
            ], function(err) {
                if (err) {
                    return done(err); 
                }
    
                
                done(null, { event_id: event_id });
            });
        });
    };
    


    const getEventById = (event_id, done) => {
        const sql = 'SELECT * FROM events WHERE event_id = ?';
        db.get(sql, [event_id], (err, row) => {
            if (err) return done(err);
            return done(null, row); 
        });
    };

    const isUserRegisteredForEvent = (event_id, user_id, done) => {
        const sql = 'SELECT * FROM attendees WHERE event_id = ? AND user_id = ?';
        db.get(sql, [event_id, user_id], (err, row) => {
            if (err) return done(err);
            return done(null, row); 
        });
    };
    
    
    const getAttendeesCount = (event_id, done) => {
        const sql = 'SELECT COUNT(*) as count FROM attendees WHERE event_id = ?';
        db.get(sql, [event_id], (err, row) => {
            if (err) return done(err);
            return done(null, row.count); 
        });
    };

    const attendEvent = (event_id, user_id, done) => {
        const sql = 'INSERT INTO attendees (event_id, user_id) VALUES (?, ?)';
        db.run(sql, [event_id, user_id], function (err) {
            if (err) return done(err);
            return done(null, this.lastID); 
        });
    };

     
    

    const searchEvent = (q, limited, offset, done) => {
        const sql="SELECT e.*, u.first_name, u.last_name, u.email FROM events e , users u WHERE e.creator_id = u.user_id AND e.name LIKE ? LIMIT ? OFFSET ? ";
    
        const queryparams = [`%${q}%`, limited, offset];
        db.all(sql, queryparams, (err, rows) => {
            if (err) return done(err);
            const events=[];

            for(const c of rows){
                events.push({
                    "event_id": c.event_id,
                    "creator": {
                      "creator_id": c.creator_id,
                      "first_name": c.first_name,
                      "last_name": c.last_name,
                      "email": c.email
                    },
                    "name": c.name,
                    "description": c.description,
                    "location": c.location,
                    "start": c.start_date,
                    "close_registration": c.close_registration,
                    "max_attendees": c.max_attendees
                  })
                  

            }
            return done(null, events);

        } );

    }



module.exports = {
    create_event,
    getEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    attendEvent,
    searchEvent,
    isUserRegisteredForEvent,
    getAttendeesCount
};