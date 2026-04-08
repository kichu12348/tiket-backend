const roleResponseObj = {
  type: "object",
  properties: {
    id: { type: "string" },
    eventId: { type: "string" },
    name: { type: "string" },
    permissions: {
      type: "array",
      items: { type: "string" },
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

const memberResponseObj = {
  type: "object",
  properties: {
    id: { type: "string" },
    eventId: { type: "string" },
    userId: { type: "string" },
    roleId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
};

export const createRoleSchema = {
  schema: {
    params: {
      type: "object",
      required: ["eventId"],
      properties: { eventId: { type: "string" } },
    },
    body: {
      type: "object",
      required: ["name", "permissions"],
      properties: {
        name: { type: "string", minLength: 2 },
        permissions: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    response: {
      201: roleResponseObj,
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getRolesSchema = {
  schema: {
    params: {
      type: "object",
      required: ["eventId"],
      properties: { eventId: { type: "string" } },
    },
    response: {
      200: {
        type: "array",
        items: roleResponseObj,
      },
      401: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const addMemberSchema = {
  schema: {
    params: {
      type: "object",
      required: ["eventId"],
      properties: { eventId: { type: "string" } },
    },
    body: {
      type: "object",
      required: ["userId", "roleId"],
      properties: {
        userId: { type: "string" },
        roleId: { type: "string" },
      },
    },
    response: {
      201: memberResponseObj,
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getMembersSchema = {
  schema: {
    params: {
      type: "object",
      required: ["eventId"],
      properties: { eventId: { type: "string" } },
    },
    response: {
      200: {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                eventId: { type: "string" },
                userId: { type: "string" },
                roleId: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                    }
                },
                role: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                    }
                }
            }
        },
      },
      401: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};
