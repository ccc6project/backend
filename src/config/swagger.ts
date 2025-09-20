import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AMEX Credit Card Service",
      version: "1.0.0",
      description: "Administración de las tarjetas de crédito"
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // You can adjust the path as needed
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
