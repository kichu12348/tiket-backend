import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@db";
import {
  tickets,
  events,
  ticketTypes,
  users,
  orders,
  ticketFormResponses,
  formFields,
} from "@db/schema";
import { eq } from "drizzle-orm";

export const getTicketPass = async (
  request: FastifyRequest<{ Params: { ticketId: string } }>,
  reply: FastifyReply,
) => {
  try {
    const { ticketId } = request.params;

    const result = await db
      .select({
        ticket: tickets,
        event: events,
        ticketType: ticketTypes,
        attendee: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        order: {
          id: orders.id,
          totalAmount: orders.totalAmount,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        },
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .innerJoin(users, eq(tickets.userId, users.id))
      .innerJoin(orders, eq(tickets.orderId, orders.id))
      .where(eq(tickets.id, ticketId));

    if (!result || result.length === 0 || !result[0]) {
      return reply.status(404).send({ error: "Ticket not found." });
    }

    const row = result[0];

    // Fetch optional form responses
    const responses = await db
      .select({
        label: formFields.label,
        value: ticketFormResponses.responseValue,
      })
      .from(ticketFormResponses)
      .innerJoin(formFields, eq(ticketFormResponses.fieldId, formFields.id))
      .where(eq(ticketFormResponses.ticketId, ticketId));

    const responsePayload = {
      id: row.ticket.id,
      qrCode: row.ticket.qrCode,
      status: row.ticket.status,
      createdAt: row.ticket.createdAt.toISOString(),
      event: {
        id: row.event.id,
        title: row.event.title,
        slug: row.event.slug,
        startDate: row.event.startDate.toISOString(),
        endDate: row.event.endDate ? row.event.endDate.toISOString() : null,
        locationType: row.event.locationType,
        locationDetails: row.event.locationDetails,
        timezone: row.event.timezone,
        coverImage: row.event.coverImage,
      },
      ticketType: {
        id: row.ticketType.id,
        name: row.ticketType.name,
        price: row.ticketType.price,
        description: row.ticketType.description,
        isTransferable: row.ticketType.isTransferable,
        isRefundable: row.ticketType.isRefundable,
      },
      attendee: {
        id: row.attendee.id,
        name: row.attendee.name,
        email: row.attendee.email,
      },
      order: {
        id: row.order.id,
        totalAmount: row.order.totalAmount,
        paymentStatus: row.order.paymentStatus,
        createdAt: row.order.createdAt.toISOString(),
      },
      responses: responses.map((r) => ({
        label: r.label,
        value: r.value,
      })),
    };

    return reply.status(200).send(responsePayload);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Failed to fetch ticket pass." });
  }
};
