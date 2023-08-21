const express = require('express');
const cors = require('cors');
const pool = require('./dbconfig');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/',async(req,res)=>{
    try {
        res.json({ msg : "done" });
    } catch (error) {
        // console.log(error?.stack?.message);
        res.json({ error });
    }
});

app.use('/user',require('./routes/User'));
app.use('/challenge',require('./routes/Challenge'));
app.use('/question',require('./routes/Question'));

const startServer = async()=>{

    try {
        const res = await pool.query(`select 'db connected' as msg`);
        app.listen(3500,async()=>{
            console.log(res.rows[0].msg);
            console.log('listening to request');
        })
    } catch (error) {
        console.log(error);
        console.log('some error occured');
    }
}

startServer();