import { APIGatewayProxyEvent } from "aws-lambda";
import { SayHi, SayHey } from "../library";

async function handler(event: any, context: any) {
  if (isAuthorized(event)) {
    return {
      statusCode: 200,
      body: "Hello, admin!",
    };
  }
  return {
    statusCode: 200,
    body: "Hello, peasant!",
  };
}

const isAuthorized = (event: APIGatewayProxyEvent) => {
  const group = event.requestContext.authorizer?.claims["cognito:groups"];
  if (group) {
    return (group as string).includes("admin");
  }
  return false;
};

export { handler };
