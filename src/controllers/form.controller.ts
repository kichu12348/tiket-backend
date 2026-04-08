import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@db";
import { events, formFields } from "@db/schema";
import { eq, and, asc } from "drizzle-orm";

interface CreateFieldBody {
  name: string;
  label: string;
  fieldType: "text" | "email" | "number" | "select" | "checkbox" | "date";
  isRequired?: boolean;
  options?: string[];
  sortOrder?: number;
}

interface UpdateFieldBody extends Partial<CreateFieldBody> {}

async function verifyEventOwner(eventId: string, userId: string): Promise<boolean> {
  const eventList = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, eventId));

  const checkEvent = eventList[0];
  if (!checkEvent) return false;
  return checkEvent.creatorId === userId;
}

export const createField = async (
  request: FastifyRequest<{ Params: { eventId: string }; Body: CreateFieldBody }>,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const { eventId } = request.params;

    const isOwner = await verifyEventOwner(eventId, user.id);
    if (!isOwner) {
      return reply.status(401).send({ error: "Only the event creator can configure custom forms." });
    }

    const body = request.body;
    
    const newFieldList = await db
      .insert(formFields)
      .values({
        eventId,
        name: body.name,
        label: body.label,
        fieldType: body.fieldType,
        isRequired: body.isRequired ?? true,
        options: body.options ? body.options : null,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();

    const createdField = newFieldList[0];
    if (!createdField) {
      return reply.status(500).send({ error: "Failed to create form field." });
    }

    return reply.status(201).send(createdField);
  } catch (error) {
    if ((error as Error).message.includes("jwt")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getFields = async (
  request: FastifyRequest<{ Params: { eventId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { eventId } = request.params;

    // Sort order natively evaluated via Drizzle to pre-sort rendering flow directly from Postgres
    const fieldsList = await db
      .select()
      .from(formFields)
      .where(eq(formFields.eventId, eventId))
      .orderBy(asc(formFields.sortOrder));

    return reply.send(fieldsList);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateField = async (
  request: FastifyRequest<{ Params: { eventId: string; fieldId: string }; Body: UpdateFieldBody }>,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const { eventId, fieldId } = request.params;
    const body = request.body;

    const isOwner = await verifyEventOwner(eventId, user.id);
    if (!isOwner) {
      return reply.status(401).send({ error: "Only the event creator can modify form fields." });
    }

    const payload: any = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.label !== undefined) payload.label = body.label;
    if (body.fieldType !== undefined) payload.fieldType = body.fieldType;
    if (body.isRequired !== undefined) payload.isRequired = body.isRequired;
    if (body.options !== undefined) payload.options = body.options;
    if (body.sortOrder !== undefined) payload.sortOrder = body.sortOrder;

    const updatedFieldList = await db
      .update(formFields)
      .set(payload)
      .where(and(eq(formFields.id, fieldId), eq(formFields.eventId, eventId)))
      .returning();

    const updatedField = updatedFieldList[0];
    if (!updatedField) {
      return reply.status(404).send({ error: "Form field not found" });
    }

    return reply.send(updatedField);
  } catch (error) {
    if ((error as Error).message.includes("jwt")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteField = async (
  request: FastifyRequest<{ Params: { eventId: string; fieldId: string } }>,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const { eventId, fieldId } = request.params;

    const isOwner = await verifyEventOwner(eventId, user.id);
    if (!isOwner) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const deletedFieldList = await db
      .delete(formFields)
      .where(and(eq(formFields.id, fieldId), eq(formFields.eventId, eventId)))
      .returning();
      
    if (deletedFieldList.length === 0) {
        return reply.status(404).send({ error: "Form field not found" });
    }

    return reply.send({ message: "Form field successfully deleted." });
  } catch (error) {
    if ((error as Error).message.includes("jwt")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};
