import { Agent } from "@mastra/core/agent";
import { customProvider } from "../providers/custom-provider";
import { visualization } from "../tools/visualization-tool";

export const dataVisualizationAgent = new Agent({
	name: "Data Visualization Agent",
	instructions: "You are a helpful assistant.",
	model: {
		id: `openai/${process.env.MODEL ?? "gpt-4o"}` as `${string}/${string}`,
		url: process.env.URL,
		apiKey: process.env.API_KEY,
	},
	tools: {
		visualization: visualization,
	},
});
