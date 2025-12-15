const users = require("../models/user.server.model");
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
   
}
 
const login = (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });

    const {error} = schema.validate(req.body);
    if(error){
        return res.status(400).json({error_message: error.details[0].message});
    }


    users.authenticateUser(req.body.email, req.body.password, (err, id) => {
        if(err === 404) return res.status(400).send("invail email or password");
        if(err) return res.sendStatus(500);

        users.getToken(id, (err, token) => {
            if (err) return res.sendStatus(500)
                
                if(token){
                    return res.status(200).send({user_id: id, session_token: token})
                }else{
                    users.setToken(id, (err, token) => {
                        if(err) return res.sendStatus(500)
                            return res.status(200).send({user_id: id, session_token: token})
                    })
                }
        })
    })
    
}

const logout = (req, res) => {

    let token = req.get('X-Authorization');

    if (!token) {
        return res.sendStatus(400); 
    }

    users.removeToken(token, (err) => {
        if (err) {
            return res.sendStatus(500); 
        }

        return res.sendStatus(200); 
    });
};
 

 
module.exports = {
    create_account: create_account,
    login: login,
  logout: logout
};
