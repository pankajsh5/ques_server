const express = require('express');
const questionController = require('../controller/questionController');
const authorizeUser = require('../middleware/authorizeUser');
const checkOwner = require('../middleware/checkOwner');

const route = express.Router();

route.use(authorizeUser);
route.get('/',questionController.getAllQuestion);
route.put('/solution',questionController.setSolution);
route.get('/solution',questionController.getSolution);

route.use(checkOwner);
route.post('/',questionController.addNewQuestion);
route.delete('/',questionController.deleteQuestion);

module.exports = route;