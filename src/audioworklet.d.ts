// https://github.com/microsoft/TypeScript/issues/28308#issuecomment-1624504462

interface AudioWorkletProcessor {
	readonly port: MessagePort;
	process(
		inputs: Float32Array[][],
		outputs: Float32Array[][],
		parameters: Record<string, Float32Array>,
	): boolean;
}

declare var AudioWorkletProcessor: {
	prototype: AudioWorkletProcessor;
	new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

type AudioParamDescriptor = {
	name: string;
	automationRate: "a-rate" | "k-rate";
	minValue: number;
	maxValue: number;
	defaultValue: number;
};

declare function registerProcessor(
	name: string,
	processorCtor: (new (
		options?: AudioWorkletNodeOptions,
	) => AudioWorkletProcessor) & {
		parameterDescriptors?: AudioParamDescriptor[];
	},
): undefined;
