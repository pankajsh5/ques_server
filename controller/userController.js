const pool = require('../dbconfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
require('dotenv').config();

const getToken = (email) => {
    const refreshToken = jwt.sign(
        { email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '30 days' }
    );
    const accessToken = jwt.sign(
        { email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    );

    return [refreshToken, accessToken];
}

const registerUser = async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        res.status(400).json({ message: 'email, username and password are required' });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(`
            INSERT INTO USERS(USERNAME,EMAIL,PASSWORD)
            VALUES ($1,$2,$3);
        `, [username, email, hashedPassword]);

        res.status(201).json({ message: 'new user created' });
    } catch (error) {
        // console.log(error);
        if( error?.code==="23505" ){
            res.status(400).json({
                message : error?.detail.replaceAll('(','').replaceAll(')','')
            });
            return;
        }
        res.status(500).json({ message: 'some error occured', error });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    // console.log('here');
    if (!email || !password) {
        res.status(401).json({ message: 'email and password are required' });
        return;
    }

    try {
        const result = await pool.query(`
            SELECT PASSWORD,USERNAME FROM USERS
            WHERE EMAIL = $1
        `, [email]);
        const hash = result?.rows[0]?.password;
        const compare = await bcrypt.compare(password, hash);

        if (compare) {

            const [refreshToken, accessToken] = getToken(email);

            await pool.query(`
                UPDATE USERS SET
                REFRESH_TOKEN = '${refreshToken}' 
                WHERE EMAIL = '${email}'
            `, []);

            res.json({
                message: 'user logged in',
                username: result.rows[0].username,
                refreshToken,
                accessToken
            });
        }
        else
            res.status(401).json({ message: 'wrong password, try again' });
    } catch (error) {
        res.status(400).json({ message: 'some error occured', error });
    }
}

const autoLoginUser = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400).json({ message: "refresh token is required" });
        return;
    }

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                res.status(400).json({ err, message: "refresh token expired : login again" });
                return;
            }
            const result = await pool.query(
                `SELECT USERNAME,REFRESH_TOKEN
                FROM USERS 
                WHERE EMAIL = $1`,
                [decoded.email]
            );
            const [_, accessToken] = getToken(decoded.email);

            if (result?.rows[0]?.refresh_token === refreshToken) {
                res.status(200).json({
                    message: "user logged in",
                    username: result.rows[0].username,
                    email: decoded.email,
                    accessToken
                });
            }
            else {
                res.status(400).json({ message: "refresh token not valid" });
            }
        }
    )

}

const refreshUser = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(400).json({ message: "couldn't find refresh token" });
        return;
    }

    try {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    res.status(403).json({ message: "refresh token expired" });
                }

                const [_, accessToken] = getToken(decoded.email);

                res.json({
                    message: "access token refreshed",
                    accessToken
                });
            }
        )
    } catch (error) {
        res.status(400).json({ message: "some error occured", error });
    }
}

const logoutUser = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ message: "email is required" });
        return;
    }

    try {
        const result = await pool.query(`
            UPDATE USERS SET 
            REFRESH_TOKEN = $1
            WHERE EMAIL = $2
            RETURNING USERNAME;
        `, [randomUUID(), email]);
        const username = result?.rows[0]?.username;
        res.json({
            message: `${username} logged out!`
        });
    } catch (error) {
        res.status(400).json({
            message: "some error occured",
            error
        })
    }
}

module.exports = {
    registerUser,
    loginUser,
    autoLoginUser,
    refreshUser,
    logoutUser
};