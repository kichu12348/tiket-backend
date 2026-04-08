import type { FastifyInstance } from "fastify";
import {
  createEvent,
  getPublicEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "@controllers/event";
import {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
  getEventByIdSchema,
  deleteEventSchema,
} from "@schemas/event";

export default async function eventRoutes(fastify: FastifyInstance) {
  fastify.post("/", createEventSchema, createEvent);
  fastify.get("/", getEventsSchema, getPublicEvents);
  fastify.get("/me", getEventsSchema, getMyEvents);
  fastify.get("/:id", getEventByIdSchema, getEventById);
  fastify.patch("/:id", updateEventSchema, updateEvent);
  fastify.delete("/:id", deleteEventSchema, deleteEvent);
}
