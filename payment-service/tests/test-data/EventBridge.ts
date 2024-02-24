import { EventBridgeEvent } from "aws-lambda";

export function getTestEventBridgeEvent<S extends string, T>(args: {
  detailType: S;
  detail: T;
}): EventBridgeEvent<S, T> {
  const { detail } = args;
  return {
    version: "0",
    account: "123456789012",
    region: "us-east-2",
    detail,
    "detail-type": args.detailType,
    source: "aws.events",
    time: "2019-03-01T01:23:45Z",
    id: "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
    resources: ["arn:aws:events:us-east-2:123456789012:rule/my-schedule"],
  };
}
