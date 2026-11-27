import { Router } from 'express';

import { participantReadRoutes } from './participants/participantReadRoutes';
import { participantRegistrationRoutes } from './participants/participantRegistrationRoutes';

export const participantRoutes = Router();

participantRoutes.use(participantReadRoutes);
participantRoutes.use(participantRegistrationRoutes);