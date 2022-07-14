import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export function getEventBody(event: APIGatewayProxyEvent) {
  return typeof event.body == "object" ? event.body : JSON.parse(event.body);
}

export function addCorsHeader(result: APIGatewayProxyResult) {
  result.headers = {
    "Content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };
}
