import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import authRoutes from "@routes/auth";
import eventRoutes from "@routes/event";
import teamRoutes from "@routes/team";
import ticketTypeRoutes from "./routes/ticket-type.routes";
import formRoutes from "./routes/form.routes";
import orderRoutes from "./routes/order.routes";
import transferRoutes from "./routes/transfer.routes";
import checkInRoutes from "./routes/check-in.routes";
import templateRoutes from "./routes/template.routes";

const __dev__ = process.env.DEBUG! === "true";

const fastify = Fastify({
  logger: __dev__,
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
});

fastify.get("/", async () => {
  return { message: "Hellow tiket" };
});

fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(eventRoutes, { prefix: "/api/events" });
fastify.register(teamRoutes, { prefix: "/api/teams" });
fastify.register(ticketTypeRoutes, { prefix: "/api/ticket-types" });
fastify.register(formRoutes, { prefix: "/api/forms" });
fastify.register(orderRoutes, { prefix: "/api/orders" });
fastify.register(transferRoutes, { prefix: "/api/tickets" });
fastify.register(checkInRoutes, { prefix: "/api/check-ins" });
fastify.register(templateRoutes, { prefix: "/api/templates" });

const start = async () => {
  try {
    const port = process.env.PORT!;
    await fastify.listen({ port: Number(port) });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
