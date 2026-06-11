import express from 'express';
import healthRouter from './routes/health.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js'

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes ---------
app.use("/api", healthRouter);

// 404 + global error handler
app.use(notFound);
app.use(errorHandler);

export default app;