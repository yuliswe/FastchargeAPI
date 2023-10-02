import { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import http from "http";
import { handSendMessageCommandData } from "./sqsHandlerUtils";
const PORT = 4100;

const server = http.createServer((req, res) => {
    if (req.method === "POST") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {
            console.log("Received POST request with data:");
            console.log(body);
            let parsedBody = null;
            try {
                parsedBody = JSON.parse(body) as SendMessageCommandInput;
            } catch (e) {
                console.error("Could not parse JSON:");
                console.error(e);
                res.end(`Could not parse JSON: ${body}`);
                return;
            }
            handSendMessageCommandData(parsedBody)
                .then((result) => {
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end(JSON.stringify(result));
                })
                .catch((e) => {
                    console.error("Error in handler:");
                    console.error(e);
                    res.end(JSON.stringify(e));
                });
        });
    } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed\n");
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
