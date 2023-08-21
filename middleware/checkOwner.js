const pool = require('../dbconfig');

const checkOwner = async(req,res,next)=>{
    const { id } = req.query;
    const { email } = req.headers;

    if( !email || !id ){
        res.status(400).json({
            message : "email and challenge_id are required"
        });
        return;
    }
    // console.log(id);
    try {
        const result = await pool.query(`
            SELECT OWNER
            FROM CHALLENGE
            WHERE ID = $1;
        `,[id]);
        // console.log(result.rows);
        if( result?.rows[0]?.owner != email ){
            res.status(400).json({
                message : "You are not allowed to perform action on this challenge"
            });
            return;
        }
        next();
    } catch (error) {
        res.status(400).json({
            message : "some error occured here",
            error
        })
    }
}

module.exports = checkOwner;