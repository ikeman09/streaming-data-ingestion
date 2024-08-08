import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as glue from "aws-cdk-lib/aws-glue";
import * as iam from "aws-cdk-lib/aws-iam";
import { Database } from "@aws-cdk/aws-glue-alpha";
import { Construct } from "constructs";

interface GlueStackProps extends cdk.StackProps {
	landing_zone_bucket: s3.Bucket;
}

export class GlueStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: GlueStackProps) {
		super(scope, id, props);

		// Create AWS Glue Crawler Role
		const glue_crawler_role = new iam.Role(this, "GlueCrawlerRole", {
			assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSGlueServiceRole"
				),
			],
			inlinePolicies: {
				GlueCrawlerPolicy: new iam.PolicyDocument({
					statements: [
						new iam.PolicyStatement({
							actions: [
								"s3:GetObject",
								"s3:PutObject",
								"s3:ListBucket",
								"s3:DeleteObject",
							],
							resources: [`${props?.landing_zone_bucket.bucketArn}/*`],
						}),
					],
				}),
			},
		});

		//create glue database
		const glue_db = new Database(this, "GlueDatabase", {
			databaseName: "streaming_db",
		});

		// Create Glue Crawler
		new glue.CfnCrawler(this, "GlueCrawler", {
			name: "streaming_crawler",
			role: glue_crawler_role.roleArn,
			databaseName: glue_db.databaseName,
			targets: {
				s3Targets: [
					{
						path: `s3://${props?.landing_zone_bucket.bucketName}/streaming/`,
					},
				],
			},
			schemaChangePolicy: {
				deleteBehavior: "DELETE_FROM_DATABASE",
				updateBehavior: "UPDATE_IN_DATABASE",
			},
		});

		// Create Athena query results S3 Bucket
		new s3.Bucket(this, "AthenaBucket", {
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});
	}
}
