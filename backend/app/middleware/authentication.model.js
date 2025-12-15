const userServerController = require('../models/user.server.model')

const isAuthenticated = (req, res, next) =>{
    let token = req.get('X-Authorization');

    userServerController.getIdFromToken(token, (err, id) => {
        if (err || id === null) {
            return res.sendStatus(401);
        }

        req.user_id = id;

        next();
    });
};

module.exports ={
     isAuthenticated
}
