import { DynamoDB } from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
// Entire uuid is imported to lamda function, not just v4
import { v4 } from "uuid";
import {
  MissingFieldError,
  validateAsSpaceEntry,
} from "../Shared/InputValidator";
import { getEventBody } from "../Shared/Utils";

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const dbClient = new DynamoDB.DocumentClient();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: "Hello from DynamoDb",
  };
  try {
    const item = getEventBody(event);
    item[PRIMARY_KEY!] = v4();
    validateAsSpaceEntry(item);
    await dbClient
      .put({
        TableName: TABLE_NAME!,
        Item: item,
      })
      .promise();
    result.body = JSON.stringify(`Created item with ID: ${item[PRIMARY_KEY!]}`);
  } catch (error) {
    if (error instanceof MissingFieldError) {
      result.statusCode = 403;
    } else {
      result.statusCode = 500;
    }
    result.body = (error as Error).message;
  }
  return result;
}

export { handler };
