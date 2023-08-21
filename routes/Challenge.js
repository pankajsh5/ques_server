const express = require('express');
const authorizeUser = require('../middleware/authorizeUser');
const challengeController = require('../controller/challengeController');

const route = express.Router();

route.use(authorizeUser);
route.get('/check',(req,res)=>{
    // console.log('check');
    return res.json({ msg : "successfull" });
})
route.get('/',challengeController.getAllChallenges);
route.post('/add',challengeController.addNewChallenge);
route.delete('/',challengeController.deleteChallenge);
route.put('/accept/:id',challengeController.acceptChallenge);

module.exports = route;