import type { UIMessage } from "ai";
import llama3Tokenizer from "llama3-tokenizer-js";
import { getMessageContent } from "./chat-utils";

export const getTokenLimit = async (basePath: string) => {
	const res = await fetch(basePath + "/api/settings");

	if (!res.ok) {
		const errorResponse = await res.json();
		const errorMessage = `Connection to vLLM server failed: ${errorResponse.error} [${res.status} ${res.statusText}]`;
		throw new Error(errorMessage);
	}
	const data = await res.json();
	return data.tokenLimit;
};

export const encodeChat = (messages: UIMessage[]): number => {
	const tokensPerMessage = 3;
	let numTokens = 0;
	for (const message of messages) {
		numTokens += tokensPerMessage;
		numTokens += llama3Tokenizer.encode(message.role).length;
		const content = getMessageContent(message);
		if (typeof content === "string") {
			numTokens += llama3Tokenizer.encode(content).length;
		}
	}
	numTokens += 3;
	return numTokens;
};
