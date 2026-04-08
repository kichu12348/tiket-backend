import type { FastifyInstance } from "fastify";
import {
  createField,
  getFields,
  updateField,
  deleteField,
} from "@controllers/form";
import {
  createFieldSchema,
  getFieldsSchema,
  updateFieldSchema,
  deleteFieldSchema,
} from "@schemas/form";

export default async function formRoutes(fastify: FastifyInstance) {
  fastify.post("/:eventId", createFieldSchema, createField);
  fastify.get("/:eventId", getFieldsSchema, getFields);
  fastify.patch("/:eventId/:fieldId", updateFieldSchema, updateField);
  fastify.delete("/:eventId/:fieldId", deleteFieldSchema, deleteField);
}
