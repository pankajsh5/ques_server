const pool = require('../dbconfig');
const { randomUUID } = require('crypto');

const getAllQuestion = async (req, res) => {
    let { id, offset } = req.query;
    let { email } = req.headers;
    if (!id) {
        res.status(400).json({ message: "challenge_id are requried" });
        return;
    }

    if (offset === null || offset === undefined)
        offset = 0;

    // console.log(email,id,offset);
    try {
        const result = await pool.query(`
            SELECT Q.ID,Q.TITLE,Q.TAGS,Q.LINK,
            (
                CASE
                    WHEN U.SOLVED is NULL THEN FALSE
                    ELSE U.SOLVED
                END
            ) AS SOLVED
            FROM QUESTION Q
            LEFT JOIN (
                SELECT SOLVED,QUESTION_ID FROM USER_TO_QUESTION
                WHERE USER_ID = '${email}'
            ) U
            ON Q.ID = U.QUESTION_ID
            WHERE Q.CHALLENGE_ID = '${id}'
            ORDER BY Q.CREATED_AT, Q.ID
            OFFSET ${offset}
        `, [])

        res.json({
            message: "successful",
            questions: result?.rows
        });
    } catch (error) {
        res.json({ message: "some error occured", error });
    }
}

const addNewQuestion = async (req, res) => {
    const { title, tags, link } = req.body;
    const { id } = req.query;
    const unique_id = randomUUID();

    if (!title || !tags || !link || !id) {
        req.status(400).json({ message: "title,challenge_id, tags and link are required" });
        return;
    }

    let tagval = tags.reduce((tagval, elem) => {
        return tagval + ',"' + elem + '"';
    }, '');

    tagval = "'{" + tagval.substring(1) + "}'";
    // console.log();
    try {
        const result = await pool.query(`
        INSERT INTO QUESTION
        VALUES('${unique_id}','${title}','${id}',${tagval},'${link}')
        RETURNING *
    `, []);

        res.status(201).json({
            message: "new question added",
            question: result.rows[0]
        });
    } catch (error) {
        res.status(400).json({
            message: "some error occured",
            error
        })
    }
}

const deleteQuestion = async (req, res) => {
    const { id, question_id } = req.query;

    if (!id || !question_id) {
        res.status(400).json({ message: "question_id and challenge_id are required" });
        return;
    }

    try {
        await pool.query(`
            DELETE FROM QUESTION
            WHERE ID = '${question_id}'
            AND CHALLENGE_ID = '${id}'
        `, []);

        res.json({ message: 'question deleted successfully' });
    } catch (error) {
        res.status(400).json({
            message: "some error occured",
            error
        })
    }
}

const setSolution = async (req, res) => {
    const { email } = req.headers;
    const { id } = req.query;
    const { language, code } = req.body;

    if (!language || !code || !id) {
        return res.status(400).json({
            message: "language,code and question_id are required"
        });

    }

    try {
        const result = await pool.query(`
            INSERT INTO USER_TO_QUESTION
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT( USER_ID,QUESTION_ID )
            DO
            UPDATE SET SOLVED = TRUE,
            LANGUAGE = $4,
            code = $5;
        `, [email, id, true, language, code]);
        // console.log(result.rows[0]);
        return res.json({ message: "question solved" });
    } catch (error) {
        return res.status(400).json({ message: "some error occured" });
    }
}

const getSolution = async (req, res) => {
    const { id } = req.query;
    let { email } = req.headers;

    if (!id || !email)
        return res.json({ message: 'question_id and email are required' });

    try {
        let result = await pool.query(`
            SELECT SOLVED, LANGUAGE, CODE
            FROM USER_TO_QUESTION
            WHERE USER_ID = $1 
            AND QUESTION_ID = $2
        `, [email, id]);

        result = result.rowCount ? result.rows[0] : {};
        return res.json({ message: 'success', solution : result });
    } catch (error) {
        res.status(400).json({ message: "some error occured" });

    }

}

module.exports = {
    getAllQuestion,
    addNewQuestion,
    deleteQuestion,
    setSolution,
    getSolution
}