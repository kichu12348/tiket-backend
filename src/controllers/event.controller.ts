import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@db";
import { events } from "@db/schema";
import { generateSlug } from "@utils";
import { eq, and, ne } from "drizzle-orm";

interface CreateEventBody {
  title: string;
  description?: string;
  coverImage?: string;
  color?: string;
  locationType?: "online" | "offline" | "hybrid";
  locationDetails?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  registrationStart?: string;
  registrationEnd?: string;
  fontFamily?: string;
  requireApproval?: boolean;
  capacity?: number | null;
  status?: "draft" | "published";
  slug?: string;
}

interface UpdateEventBody extends Partial<Omit<CreateEventBody, "status">> {
  status?: "draft" | "published" | "completed" | "cancelled";
}

export const createEvent = async (
  request: FastifyRequest<{ Body: CreateEventBody }>,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; type: string };

    // if (user.type !== "organization") {
    //   return reply
    //     .status(403)
    //     .send({ error: "Only organizations can create events." });
    // }

    const body = request.body;

    const slug = generateSlug(body.title);

    const existingSlugList = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.slug, slug));

    if (existingSlugList.length > 0) {
      // if slug already exists return an error
      return reply
        .status(400)
        .send({ error: "An event with a similar title already exists" });
    }

    const newEventList = await db
      .insert(events)
      .values({
        title: body.title,
        description: body.description,
        coverImage: body.coverImage,
        color: body.color,
        locationType: body.locationType || "offline",
        locationDetails: body.locationDetails,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        timezone: body.timezone || "UTC",
        registrationStart: body.registrationStart
          ? new Date(body.registrationStart)
          : null,
        registrationEnd: body.registrationEnd
          ? new Date(body.registrationEnd)
          : null,
        fontFamily: body.fontFamily || "'Inter', sans-serif",
        requireApproval: body.requireApproval || false,
        capacity: body.capacity || null,
        status: body.status || "draft",
        organizationId: user.id,
        slug: slug,
      })
      .returning();

    const createdEvent = newEventList[0];
    if (!createdEvent) {
      throw new Error("Failed to create event");
    }

    return reply.status(201).send(createdEvent);
  } catch (error) {
    if (
      (error as Error).message.includes("Authorization") ||
      (error as Error).message.includes("jwt")
    ) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    console.log(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getPublicEvents = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const publishedEvents = await db
      .select()
      .from(events)
      .where(eq(events.status, "published"));

    return reply.send(publishedEvents);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getMyEvents = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };

    const myEventsList = await db
      .select()
      .from(events)
      .where(eq(events.organizationId, user.id));

    return reply.send(myEventsList);
  } catch (error) {
    if (
      (error as Error).message.includes("Authorization") ||
      (error as Error).message.includes("jwt")
    ) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getEventById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const eventId = request.params.id;

    const eventList = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    const event = eventList[0];
    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    if (event.status !== "published") {
      try {
        await request.jwtVerify();
        const user = request.user as { id: string };
        if (event.organizationId !== user.id) {
          return reply.status(404).send({ error: "Event not found" });
        }
      } catch (err) {
        return reply.status(404).send({ error: "Event not found" });
      }
    }

    return reply.send(event);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getEventBySlug = async (
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) => {
  try {
    const eventSlug = request.params.slug;
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.slug, eventSlug));

    if (!event) {
      return reply.status(404).send({ error: "Event not found" });
    }

    if (event.status !== "published") {
      try {
        await request.jwtVerify();
        const user = request.user as { id: string };
        if (event.organizationId !== user.id) {
          return reply.status(404).send({ error: "Event not found" });
        }
      } catch (err) {
        return reply.status(404).send({ error: "Event not found" });
      }
    }

    return reply.send(event);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateEvent = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateEventBody }>,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const eventId = request.params.id;
    const body = request.body;

    const eventList = await db
      .select({ organizationId: events.organizationId })
      .from(events)
      .where(eq(events.id, eventId));

    const eventToUpdate = eventList[0];
    if (!eventToUpdate) {
      return reply.status(404).send({ error: "Event not found" });
    }

    if (eventToUpdate.organizationId !== user.id) {
      return reply
        .status(401)
        .send({ error: "Unauthorized to modify this event" });
    }

    const payload: any = { ...body, updatedAt: new Date() };
    if (body.startDate) payload.startDate = new Date(body.startDate);
    if (body.endDate) payload.endDate = new Date(body.endDate);
    if (body.timezone) payload.timezone = body.timezone;
    if (body.registrationStart)
      payload.registrationStart = new Date(body.registrationStart);
    if (body.registrationEnd)
      payload.registrationEnd = new Date(body.registrationEnd);
    if (body.requireApproval !== undefined)
      payload.requireApproval = body.requireApproval;
    if (body.capacity !== undefined) payload.capacity = body.capacity;
    if (body.status !== undefined) payload.status = body.status;

    const updatedEventList = await db
      .update(events)
      .set(payload)
      .where(eq(events.id, eventId))
      .returning();

    const updatedEvent = updatedEventList[0];
    if (!updatedEvent) {
      return reply
        .status(500)
        .send({ error: "Failed to update event details" });
    }

    return reply.send(updatedEvent);
  } catch (error) {
    if (
      (error as Error).message.includes("Authorization") ||
      (error as Error).message.includes("jwt")
    ) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const deleteEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const eventId = request.params.id;

    const eventList = await db
      .select({ organizationId: events.organizationId })
      .from(events)
      .where(eq(events.id, eventId));

    const eventToDelete = eventList[0];
    if (!eventToDelete) {
      return reply.status(404).send({ error: "Event not found" });
    }

    if (eventToDelete.organizationId !== user.id) {
      return reply
        .status(401)
        .send({ error: "Unauthorized to delete this event" });
    }

    await db.delete(events).where(eq(events.id, eventId));

    return reply.send({ message: "Event deleted successfully" });
  } catch (error) {
    if (
      (error as Error).message.includes("Authorization") ||
      (error as Error).message.includes("jwt")
    ) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const updateEventSlug = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { slug: string } }>,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const eventId = request.params.id;
    const { slug } = request.body;

    const eventList = await db
      .select({ organizationId: events.organizationId })
      .from(events)
      .where(eq(events.id, eventId));

    const eventToUpdate = eventList[0];
    if (!eventToUpdate) {
      return reply.status(404).send({ error: "Event not found" });
    }

    if (eventToUpdate.organizationId !== user.id) {
      return reply
        .status(401)
        .send({ error: "Unauthorized to modify this event" });
    }

    const existingSlugList = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.slug, slug), ne(events.id, eventId)));

    if (existingSlugList.length > 0) {
      return reply
        .status(400)
        .send({ error: "An event with this slug already exists" });
    }

    const updatedEventList = await db
      .update(events)
      .set({ slug, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning({ slug: events.slug, id: events.id });

    const updatedEvent = updatedEventList[0];

    if (!updatedEvent) {
      return reply
        .status(500)
        .send({ error: "Failed to update event slug, try again" });
    }

    return reply.send({
      message: "Slug updated successfully",
      slug: updatedEvent.slug,
      id: updatedEvent.id,
    });
  } catch (error) {
    if (
      (error as Error).message.includes("Authorization") ||
      (error as Error).message.includes("jwt")
    ) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};
