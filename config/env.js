import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
export default {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SESSION_SECRET: process.env.SESSION_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRED_IN: process.env.JWT_EXPIRED_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    GOOGLE_AUTH_URI: 'https://accounts.google.com/o/oauth2/auth',
}