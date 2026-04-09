import type { FastifyRequest, FastifyReply } from "fastify";
import db from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export const signup = async (
  request: FastifyRequest<{
    Body: { name: string; email: string; password: string };
  }>,
  reply: FastifyReply,
) => {
  const { name, email, password } = request.body;

  try {
    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUsers.length > 0) {
      return reply
        .status(409)
        .send({ error: "User with this email already exists" });
    }

    // Hash password natively using Bun
    const passwordHash = await Bun.password.hash(password);

    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        slug: "",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        type: users.type,
        description: users.description,
        isVerified: users.isVerified,
      });

    const insertedUser = newUser[0];
    if (!insertedUser) {
      throw new Error("Failed to create user");
    }

    const token = await reply.jwtSign(
      {
        id: insertedUser.id,
        email: insertedUser.email,
        type: insertedUser.type,
      },
      { expiresIn: "30d" },
    );

    return reply.status(201).send({
      message: "User created successfully",
      user: insertedUser,
      token,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const login = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply,
) => {
  const { email, password } = request.body;

  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const user = existingUsers[0];
    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      // User likely signed up using Google/OAuth
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Verify password natively mapped from Bun
    const isMatch = await Bun.password.verify(password, user.passwordHash);

    if (!isMatch) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = await reply.jwtSign(
      { id: user.id, email: user.email, type: user.type },
      { expiresIn: "30d" },
    );

    return reply.send({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        description: user.description,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();

    const decoded = request.user as { id: string; email: string; type: string };

    const existingUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        type: users.type,
        description: users.description,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, decoded.id));

    if (existingUsers.length === 0) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.send({ user: existingUsers[0] });
  } catch (error) {
    return reply.status(401).send({ error: "Unauthorized or invalid token" });
  }
};
