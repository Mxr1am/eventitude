const events = require("../controllers/event.server.controllers")
const auth = require('../middleware/authentication.middleware')

module.exports= function(app){
    app.route("/events")
    .post( auth.isAuthenticated, events.createEvent);

    app.route("/event/:event_id")
    .get(events.getEvent)
    .patch(auth.isAuthenticated, events.updateEvent)
    .post(auth.isAuthenticated, events.attendEvent)
    .delete(auth.isAuthenticated, events.deleteEvent)

    app.route("/search")
    .get(events.searchEvent);
};
