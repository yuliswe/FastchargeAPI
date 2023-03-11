import AWS from "aws-sdk";
export async function getParameterFromAWSSystemsManager(parameterName: string): Promise<string | undefined> {
    try {
        const params: AWS.SSM.GetParameterRequest = {
            Name: parameterName,
            WithDecryption: true,
        };

        const ssm = new AWS.SSM({ region: "us-east-1" });
        const data = await ssm.getParameter(params).promise();
        return data.Parameter?.Value;
    } catch (err) {
        console.error(`Failed to get parameter from cloud`, err);
    }
    return undefined;
}
