import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET as string;

export const handleRegisterUser = async (req: Request, res: Response): Promise<any> => {
  const { username, email, password } = req.body;
  console.log("Received registration request:", req.body);  // Check if data is received
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const [existingUser]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // Check if username already exists
    const [existingName]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingName.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);
    await pool.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    console.log('User inserted into DB');  // Check if user is inserted into the DB

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error.message, error.stack);
    res.status(500).json({ error: 'Error registering user' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows]: any = await pool.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.userid, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
    console.log('User logged in successfully:', user.userid);  // Check if user is logged in successfully
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const fetchUser = async (req: Request, res: Response): Promise<void> => {
  console.log("Trying to confirm token and send back user details");

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { 
      res.status(401).json({ error: 'No token provided' });
    }

    console.log("TOKEN RECEIVED FROM FRONTEND:", token);

    const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decoded.id;

    console.log('FETCHING USER DETAILS FOR USER ID:', userId);

    const query = 'SELECT userid, name FROM users WHERE userid = ?';
    const [rows]: any = await pool.execute(query, [userId]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    console.log('User details:', user);

    res.status(200).json({ userId: user.userid, name: user.name });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
};