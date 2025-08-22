import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database!');
    // Perform database operations here
    connection.release(); // Release the connection back to the pool
});

export default pool;