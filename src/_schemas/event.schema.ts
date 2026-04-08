const eventResponseObj = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    coverImage: { type: ["string", "null"] },
    locationType: { type: "string", enum: ["online", "offline"] },
    locationDetails: { type: ["string", "null"] },
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    closingDate: { type: ["string", "null"], format: "date-time" },
    status: {
      type: "string",
      enum: ["draft", "published", "completed", "cancelled"],
    },
    creatorId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
};

export const createEventSchema = {
  schema: {
    body: {
      type: "object",
      required: ["title", "startDate", "endDate"],
      properties: {
        title: { type: "string", minLength: 3 },
        description: { type: "string" },
        coverImage: { type: "string" },
        locationType: { type: "string", enum: ["online", "offline"] },
        locationDetails: { type: "string" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        closingDate: { type: "string", format: "date-time" },
        status: { type: "string", enum: ["draft", "published"] },
      },
    },
    response: {
      201: eventResponseObj,
      400: errorResponseSchema,
      401: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const updateEventSchema = {
  schema: {
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
    body: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 3 },
        description: { type: "string" },
        coverImage: { type: "string" },
        locationType: { type: "string", enum: ["online", "offline"] },
        locationDetails: { type: "string" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        closingDate: { type: "string", format: "date-time" },
        status: {
          type: "string",
          enum: ["draft", "published", "completed", "cancelled"],
        },
      },
      minProperties: 1,
    },
    response: {
      200: eventResponseObj,
      400: errorResponseSchema,
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getEventsSchema = {
  schema: {
    response: {
      200: {
        type: "array",
        items: eventResponseObj,
      },
      401: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getEventByIdSchema = {
  schema: {
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
    response: {
      200: eventResponseObj,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const getEventBySlugSchema = {
  schema: {
    params: {
      type: "object",
      required: ["slug"],
      properties: { slug: { type: "string" } },
    },
    response: {
      200: eventResponseObj,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};

export const deleteEventSchema = {
  schema: {
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
    response: {
      200: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      401: errorResponseSchema,
      404: errorResponseSchema,
      500: errorResponseSchema,
    },
  },
};
