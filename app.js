const express = require("express");
const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

const xss = require("xss-clean");
const app = express();

app.use(helmet());
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, pls try again Later",
});
app.use("/api", limiter);

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(mongoSanitize());
app.use(xss());
corsOptions = {
  origin: "http://localhost:8081",
};
app.use(cors());
app.use("/api/v1/users/", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
