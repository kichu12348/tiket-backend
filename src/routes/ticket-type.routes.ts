import type { FastifyInstance } from "fastify";
import {
  createTicketType,
  getTicketTypes,
  updateTicketType,
  deleteTicketType,
} from "@controllers/ticket-type";
import {
  createTicketTypeSchema,
  getTicketTypesSchema,
  updateTicketTypeSchema,
  deleteTicketTypeSchema,
} from "@schemas/ticket-type";

export default async function ticketTypeRoutes(fastify: FastifyInstance) {
  fastify.post("/:eventId", createTicketTypeSchema, createTicketType);
  fastify.get("/:eventId", getTicketTypesSchema, getTicketTypes);
  fastify.patch(
    "/:eventId/:ticketTypeId",
    updateTicketTypeSchema,
    updateTicketType,
  );
  fastify.delete(
    "/:eventId/:ticketTypeId",
    deleteTicketTypeSchema,
    deleteTicketType,
  );
}
