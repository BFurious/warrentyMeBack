import express from 'express';

import { AuthRouter } from '../modules/auth/login.js';
import { DriveRouter } from '../modules/drive/googleDrive.js';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRouter,
    },
    {
        path: '/storage',
        route: DriveRouter,
    }
]
moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
