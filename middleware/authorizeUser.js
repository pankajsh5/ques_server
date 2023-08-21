const jwt = require('jsonwebtoken');

const authorizeUser = async (req,res,next)=>{
    const accessToken = req?.headers?.authorization?.split(' ')[1];
    // console.log(req.params);
    if( !accessToken ){
        res.status(401).json({ message : "access token not provided" });
        return;
    }
    try {
        const { email } = jwt.verify(
        accessToken,
            process.env.ACCESS_TOKEN_SECRET
        )
        req.headers = { ...req.headers,email };
        next();
    } catch (error) {
        
        res.status(401).json({ message : 'access token expired' });
    }
}

module.exports = authorizeUser;