const users = require("../models/user.server.models")
const Joi = require("joi");

const create_account = (req, res) => {
    const schema = Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });

    const {error} = schema.validate(req.body);
    if(error)
        return res.status(400).json({error_message: error.details[0].message});
    let user = Object.assign({}, req.body);

    users.create_account(user, (err, id) =>{
        if (err === 400) {
            return res.status(400).json({ error_message: "email already in use"});

        } else if (err) {
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.status(201).send({ user_id: id});
        }
    });
    
};

const login = (req, res) => {
    return res.sendStatus(500);
}

const logout = (req, res) => {
    return res.sendStatus(500);
}

module.exports = {
    create_account: create_account,
    login: login,
    logout: logout
};