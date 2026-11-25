import { defineBackend } from "@aws-amplify/backend";
import { Aspects, IAspect } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnFunction } from "aws-cdk-lib/aws-lambda";
import { IConstruct } from "constructs";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
});

// Add Amazon Bedrock (N. Virginia) as an HTTP data source for the GraphQL API.
const bedrockDataSource = backend.data.resources.graphqlApi.addHttpDataSource(
  "bedrockDS",
  "https://bedrock-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: "us-east-1",
      signingServiceName: "bedrock",
    },
  }
);

// Allow that data source to call the model.
// Changed from the tutorial: Amazon Nova Lite instead of Claude 3.5 Sonnet.
bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
    ],
    actions: ["bedrock:InvokeModel"],
  })
);

/**
 * New / Free-plan AWS accounts only allow Lambda functions up to 512 MB of memory.
 * Amplify's data backend creates a helper Lambda (CDK BucketDeployment) that asks for
 * 1536 MB, which makes the deploy fail. This caps every Lambda in the backend at 512 MB.
 * (Same fix as in my profilesapp project.)
 */
const MAX_LAMBDA_MEMORY_MB = 512;

class CapLambdaMemory implements IAspect {
  visit(node: IConstruct): void {
    if (
      node instanceof CfnFunction &&
      typeof node.memorySize === "number" &&
      node.memorySize > MAX_LAMBDA_MEMORY_MB
    ) {
      node.memorySize = MAX_LAMBDA_MEMORY_MB;
    }
  }
}

Aspects.of(backend.data.stack.node.root).add(new CapLambdaMemory());
