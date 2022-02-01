import { APIGatewayProxyEvent } from "aws-lambda";

export function getEventBody(event: APIGatewayProxyEvent) {
  return typeof event.body == "object" ? event.body : JSON.parse(event.body);
}
