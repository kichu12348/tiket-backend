import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@db";
import { events, orders, tickets, ticketTypes, ticketFormResponses } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

interface PurchaseItem {
  ticketTypeId: string;
  formResponses?: {
    fieldId: string;
    responseValue: string;
  }[];
}

interface CreateOrderBody {
  eventId: string;
  purchases: PurchaseItem[];
}

export const createOrder = async (
  request: FastifyRequest<{ Body: CreateOrderBody }>,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string };
    const { eventId, purchases } = request.body;

    if (!purchases || purchases.length === 0) {
      return reply.status(400).send({ error: "No tickets requested." });
    }

    const typeQuantities: Record<string, number> = {};
    for (const p of purchases) {
      typeQuantities[p.ticketTypeId] = (typeQuantities[p.ticketTypeId] || 0) + 1;
    }
    const requestedTypes = Object.keys(typeQuantities);

    // Initialize Atomic Block Mapping
    return await db.transaction(async (tx) => {
      let totalAmount = 0;

      for (const tTypeId of requestedTypes) {
        const tierList = await tx.select().from(ticketTypes).where(eq(ticketTypes.id, tTypeId));
        const tier = tierList[0];

        if (!tier) {
          tx.rollback();
          return reply.status(404).send({ error: `Ticket tier mapped to ID ${tTypeId} not found.` });
        }

        if (tier.eventId !== eventId) {
          tx.rollback();
          return reply.status(400).send({ error: `Mismatching Tier bounds.` });
        }

        const requestedAmount = typeQuantities[tTypeId] || 0;
        
        // Execution limiting bound structure check
        if (tier.quantityLimit !== null) {
          const soldQuery = await tx
            .select({ count: sql<string>`count(*)` }) 
            .from(tickets)
            .where(and(eq(tickets.ticketTypeId, tTypeId), eq(tickets.status, "active")));
            
          const soldCountObj = soldQuery[0];
          const sold = soldCountObj ? Number(soldCountObj.count) : 0;

          if (sold + requestedAmount > tier.quantityLimit) {
            tx.rollback();
            return reply.status(409).send({ error: `Insufficient ticket inventory for ${tier.name}. Only ${tier.quantityLimit - sold} remaining.` });
          }
        }

        totalAmount += parseFloat(tier.price) * requestedAmount;
      }

      // Root Checkout Map
      const newOrderList = await tx.insert(orders).values({
        eventId,
        userId: user.id,
        totalAmount: totalAmount.toFixed(2),
        paymentStatus: "pending",
        paymentProvider: "mock_stripe",
      }).returning();

      const order = newOrderList[0];
      if (!order) {
          tx.rollback();
          return reply.status(500).send({ error: "Failed to allocate order root block." });
      }

      const createdTickets = [];

      for (const p of purchases) {
          // Securing standard hash mechanism binding the ticket mapping identically
          const uniqueQr = `${order.id}-${crypto.randomUUID()}`;

          const ticketList = await tx.insert(tickets).values({
             orderId: order.id,
             ticketTypeId: p.ticketTypeId,
             userId: user.id,
             eventId: eventId,
             qrCode: uniqueQr,
             status: "active",
          }).returning();

          const ticket = ticketList[0];
          if (!ticket) continue;

          createdTickets.push(ticket);

          if (p.formResponses && p.formResponses.length > 0) {
              const formattedResponses = p.formResponses.map((r) => ({
                 ticketId: ticket.id,
                 fieldId: r.fieldId,
                 responseValue: r.responseValue
              }));

              await tx.insert(ticketFormResponses).values(formattedResponses);
          }
      }

      return reply.status(201).send({
        order,
        tickets: createdTickets
      });
    });

  } catch (error) {
    if ((error as Error).message.includes("jwt")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const payOrderMock = async (
  request: FastifyRequest<{ Params: { orderId: string } }>,
  reply: FastifyReply
) => {
    try {
        await request.jwtVerify();
        const user = request.user as { id: string };
        const { orderId } = request.params;

        const updated = await db.update(orders)
            .set({ paymentStatus: "success" })
            .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
            .returning();
            
        if(updated.length === 0){
             return reply.status(404).send({ error: "Order not found or you don't have access." });
        }

        return reply.send({ message: "Mock transaction validated and secured.", order: updated[0] });

    } catch (error) {
         if ((error as Error).message.includes("jwt")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
}
