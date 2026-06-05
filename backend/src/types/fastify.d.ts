import 'fastify';
import type { PublicUser } from '../modules/auth/auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: PublicUser;
  }
}
