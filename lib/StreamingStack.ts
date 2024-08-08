import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as firehose from "@aws-cdk/aws-kinesisfirehose-alpha";
import * as destinations from "@aws-cdk/aws-kinesisfirehose-destinations-alpha";

export class StreamingStack extends cdk.Stack {
	public readonly landing_zone_bucket: s3.Bucket;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Create landing zone S3 bucket
		this.landing_zone_bucket = new s3.Bucket(this, "LandingZoneBucket", {
			removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
			autoDeleteObjects: true, // NOT recommended for production
		});

		// Create an Amazon S3 destination
		const s3_destination = new destinations.S3Bucket(this.landing_zone_bucket, {
			dataOutputPrefix: "streaming/!{timestamp:yyyy/MM}",
			errorOutputPrefix: "!{firehose:error-output-type}/!{timestamp:yyyy/MM}",
			bufferingInterval: cdk.Duration.seconds(60), // every 60 seconds
			bufferingSize: cdk.Size.mebibytes(1), // 1 MB
		});

		// Create a Kinesis Data Firehose delivery stream
		new firehose.DeliveryStream(this, "DeliveryStream", {
			destinations: [s3_destination],
		});
	}
}
