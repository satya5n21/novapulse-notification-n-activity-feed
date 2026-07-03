import express from 'express';
import healthRouter from './routes/health.js';
import eventsRouter from './routes/event.js';
import { invalidReqbodyHandler, notFound, errorHandler } from './middlewares/errorHandler.js'

const app = express();

app.use(express.json());

// Handle malformed JSON request bodies
app.use(invalidReqbodyHandler);

app.use(express.urlencoded({ extended: true }));

// Routes ---------
app.use("/api", healthRouter);
app.use("/api/events", eventsRouter);

// 404 + global error handler
app.use(notFound);
app.use(errorHandler);

export default app;
