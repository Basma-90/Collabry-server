import { config } from 'dotenv';
config();

export default () => ({
    PORT: parseInt(process.env.PORT, 10) || 4000,
    database: {
      url: process.env.DATABASE_URL,
    },
    publicKey: {
        secret: process.env.PUBLIC_KEY,
    },
    privateKey: {
        secret: process.env.PRIVATE_KEY,
    },
    accessTokenTTL:{
        TTL: process.env.ACCESS_TOKEN_TTL,
    },
    refreshTokenTTL: {
        TTL: process.env.REFRESH_TOKEN_TTL,
    },
    nodeEnv :{
        type: process.env.NODE_ENV,
    },
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    emailVerificationURL:{
        URL: process.env.EMAIL_VERIFICATION_URL,
    },
    passwordResetURL:{
        URL: process.env.PASSWORD_RESET_URL,
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  });