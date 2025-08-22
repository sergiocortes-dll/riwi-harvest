import express from 'express';
import cors from 'cors';

import pool from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hola Mundo' })
})

app.get('/test', async (req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM test`);

    res.status(200).json(rows);
})

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`puerto corriendo en http://localhost:${process.env.EXPRESS_PORT}`)
})