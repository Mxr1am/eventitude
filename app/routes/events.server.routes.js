const users = require("../controllers/events.server.controllers")

module.exports = function(app){
    app.route("/events")
    .post(events.create_event);

    app.route("/events/{event_id}:")
    .post(events.event_id);

    app.route("/logout")
    .post(users.logout);
}
