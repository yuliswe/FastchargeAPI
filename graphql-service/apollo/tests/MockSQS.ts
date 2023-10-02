import { SendMessageCommandInput } from "@aws-sdk/client-sqs";
import assert from "assert";

type QueueIdentifier = {
    queueUrl: string;
    groupId?: string;
};
type Message = {
    input: SendMessageCommandInput;
    handler: (command: SendMessageCommandInput) => Promise<any>;
};

function getKey({ queueUrl, groupId }: QueueIdentifier): string {
    return `${queueUrl}:${groupId ?? "undefined"}`;
}

function identifyQueue({ input: { QueueUrl, MessageGroupId } }: Message): QueueIdentifier {
    assert(QueueUrl, "QueueUrl is required");
    return {
        queueUrl: QueueUrl,
        groupId: MessageGroupId,
    };
}

class MockSQS {
    queues = new Map<string, SingleQueue>();
    errors: any[] = [];

    enqueue(message: Message) {
        this.throwIfErrors();
        const queueId = identifyQueue(message);
        const key = getKey(queueId);
        if (!this.queues.has(key)) {
            this.queues.set(
                key,
                new SingleQueue({
                    identifier: queueId,
                    onQueueEmpty: (queueId) => this.onQueueEmpty(queueId),
                    onQueueError: (queueId, error) => this.onQueueError(queueId, error),
                })
            );
        }
        const queue = this.queues.get(key)!;
        queue.enqueue(message);
    }

    private onQueueEmpty(queueId: QueueIdentifier) {
        // do nothing
    }

    private onQueueError(queueId: QueueIdentifier, error: any) {
        this.errors.push(error);
    }

    private throwIfErrors() {
        if (this.errors.length > 0) {
            throw this.errors[0];
        }
    }

    async waitForQueuesToEmpty() {
        this.throwIfErrors();
        for (const queue of this.queues.values()) {
            await queue.waitForEmpty();
            this.throwIfErrors();
        }
    }

    reset() {
        this.queues.clear();
        this.errors = [];
    }
}

type SingleQueueProps = {
    onQueueEmpty: (queueId: QueueIdentifier) => void;
    onQueueError: (queueId: QueueIdentifier, error: any) => void;
    identifier: QueueIdentifier;
};
export class SingleQueue {
    constructor(public props: SingleQueueProps) {}

    isRunning = false;
    messages: Message[] = [];
    messageDedupIds = new Set<string>();

    enqueue(message: Message) {
        const dedupId = message.input.MessageDeduplicationId;
        const groupId = message.input.MessageGroupId;
        assert((dedupId?.length ?? 0) < 128, "MessageDeduplicationId must be less than 128 characters");
        assert((groupId?.length ?? 0) < 128, "MessageGroupId must be less than 128 characters");
        if (dedupId && this.messageDedupIds.has(dedupId)) {
            return;
        }
        if (dedupId) {
            this.messageDedupIds.add(dedupId);
        }
        this.messages.push(message);
        setTimeout(() => {
            this.wakeQueue().catch((error) => {
                this.props.onQueueError(this.props.identifier, error);
            });
        }, 5000); // simulate a delay
    }

    async wakeQueue() {
        if (!this.isRunning) {
            this.isRunning = true;
            while (this.messages.length > 0) {
                const message = this.messages[0];
                await message.handler(message.input);
                this.messages.shift();
            }
            this.props.onQueueEmpty(this.props.identifier);
            this.isRunning = false;
        }
    }

    async waitForEmpty() {
        await this.wakeQueue();
        while (this.messages.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
}

export const mockSQS = new MockSQS();
