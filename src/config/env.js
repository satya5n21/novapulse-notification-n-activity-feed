import dotenv from 'dotenv';
dotenv.config();

const _required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
};

export const ENV = {
  PORT: process.env.PORT || 4800,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: _required("MONGO_URI"),

  REDIS_HOST: _required("REDIS_HOST"),
  REDIS_PORT: parseInt(_required("REDIS_PORT")),
  REDIS_PASSWORD: _required("REDIS_PASSWORD")
}

