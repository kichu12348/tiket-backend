export const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    type: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

export const signUpSchema = {
  schema: {
    body: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: { type: "string", minLength: 2 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          user: userResponseSchema,
        },
      },
      400: errorResponseSchema,
      409: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const loginSchema = {
  schema: {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string" },
          user: userResponseSchema,
        },
      },
      400: errorResponseSchema,
      401: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getMeSchema = {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          user: userResponseSchema,
        },
      },
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};
