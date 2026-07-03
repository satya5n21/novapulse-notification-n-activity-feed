export const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

export const errorHandler = (error, req, res, next) => {
    const status = error.status || 500;
    const isProduction = process.env.NODE_ENV === "production";

    console.error(`[Error] ${status} - ${error.message}`);

    res.status(status).json({
        success: false,
        error: {
            message: error.message || "Internal Server Error",
            // never lack stack trace in production
            ...(isProduction ? {} : { stack: error.stack }),
        },
    });
}

export const invalidReqbodyHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {

        return res.status(400).json({
            success: false,
            error: { message: 'Malformed JSON request body' }
        });
    }
    next(err);
}