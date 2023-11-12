let rawrCtx: AudioContext;

const loadedWorklets = new WeakMap<AudioContext, Set<string>>();

export const getContext = (ctx?: AudioContext) => ctx ?? (rawrCtx ??= new AudioContext());

export const isWorkletLoaded = (name: string, ctx?: AudioContext) =>
	!!loadedWorklets.get(getContext(ctx))?.has(name);

export const registerWorkletLoaded = (name: string, ctx?: AudioContext) => {
	const context = getContext(ctx);
	if (loadedWorklets.has(context)) loadedWorklets.get(context)!.add(name);
	else loadedWorklets.set(context, new Set([name]));
};
