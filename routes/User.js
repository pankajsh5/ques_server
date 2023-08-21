const express = require('express');
const route = express.Router();
const userController = require('../controller/userController');

route.post('/register',userController.registerUser);
route.post('/login',userController.loginUser);
route.post('/logout',userController.logoutUser);
route.post('/refresh',userController.refreshUser);
route.post('/autologin',userController.autoLoginUser);

module.exports = route;