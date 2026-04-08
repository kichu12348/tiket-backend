import type { FastifyInstance } from "fastify";
import {
  createRole,
  getRoles,
  addTeamMember,
  getTeamMembers,
} from "@controllers/team";
import {
  createRoleSchema,
  getRolesSchema,
  addMemberSchema,
  getMembersSchema,
} from "@schemas/team";

export default async function teamRoutes(fastify: FastifyInstance) {
  fastify.post("/:eventId/roles", createRoleSchema, createRole);
  fastify.get("/:eventId/roles", getRolesSchema, getRoles);
  fastify.post("/:eventId/members", addMemberSchema, addTeamMember);
  fastify.get("/:eventId/members", getMembersSchema, getTeamMembers);
}
