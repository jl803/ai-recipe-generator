// AppSync JavaScript resolver that calls Amazon Bedrock over HTTP.
// Changed from the tutorial: the tutorial used Anthropic Claude 3.5 Sonnet, which is no
// longer offered (and Anthropic models need a use-case form). This version uses
// Amazon Nova Lite, Amazon's own model, which uses a different request/response format.

const MODEL_ID = "amazon.nova-lite-v1:0";

export function request(ctx) {
  const { ingredients = [] } = ctx.args;

  // Construct the prompt with the provided ingredients
  const prompt = `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}.`;

  // Return the request configuration (Nova "messages-v1" format)
  return {
    resourcePath: `/model/${MODEL_ID}/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schemaVersion: "messages-v1",
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
        },
      }),
    },
  };
}

export function response(ctx) {
  // Parse the response body
  const parsedBody = JSON.parse(ctx.result.body);

  // Nova returns { output: { message: { content: [{ text }] } } }.
  // If Bedrock returned an error instead, pass its message through so we can see it.
  if (!parsedBody.output) {
    return { body: null, error: parsedBody.message || ctx.result.body };
  }

  return {
    body: parsedBody.output.message.content[0].text,
  };
}
