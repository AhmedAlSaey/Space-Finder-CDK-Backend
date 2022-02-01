import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../services/SpaceTable/Create";

let event: APIGatewayProxyEvent = {
  queryStringParameters: {
    spaceId: "dc368a93-c80d-465e-b988-4781f19f251e",
  },
  body: {
    name: "Helloooooo",
  },
} as any;
const result = handler(event, {} as any).then((api) => {
  const items = JSON.parse(api.body);
  console.log("Request successful");
});
