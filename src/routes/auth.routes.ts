import type { FastifyInstance } from "fastify";
import { signup, login, getMe } from "@controllers/auth";
import { signUpSchema, loginSchema, getMeSchema } from "@schemas/auth";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/signup", signUpSchema, signup);
  fastify.post("/login", loginSchema, login);

  // Protected Route Requires standard Authorization: Bearer <token> Header
  fastify.get("/me", getMeSchema, getMe);
}
