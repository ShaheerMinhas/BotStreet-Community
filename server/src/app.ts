import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes'; // Import the auth routes

const app = express();

// Enable CORS
app.use(
  cors({
    origin: ['http://localhost:3001'], // Add both development and production URLs
     // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true, // Allow cookies or authorization headers
  })
);

// Middleware to parse JSON
app.use(express.json());

// Use routes


// app.use('/api/email', emailRoutes); // Email-related routes
// app.use('/api/organization', organizationRoutes); // Organization-related routes
 app.use('/api/auth', authRoutes); // Authentication routes (register, login)
// app.use('/api/fetch' ,fetchUserRoutes);
export default app;
