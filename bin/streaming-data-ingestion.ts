#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StreamingStack } from "../lib/StreamingStack";
import { GlueStack } from "../lib/GlueStack";

const app = new cdk.App();

const streaming_stack = new StreamingStack(app, "StreamingStack", {
	env: {
		account: "account-id",
		region: "region",
	},
});

new GlueStack(app, "GlueStack", {
	env: {
		account: "account-id",
		region: "region",
	},

	landing_zone_bucket: streaming_stack.landing_zone_bucket,
});
