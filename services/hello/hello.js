import { SayHi } from "../library";

exports.main = async function (event, context) {
  return {
    statusCode: 200,
    body: SayHi(),
  };
};
