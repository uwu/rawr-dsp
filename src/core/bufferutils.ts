export function joinBufs(bufs: ArrayBuffer[]): ArrayBuffer {
	const target = new Uint8Array(bufs.map(b => b.byteLength).reduce((a, b) => a + b));
	let seek = 0;
	for (const b of bufs)
	{
		target.set(new Uint8Array(b), seek);
		seek += b.byteLength;
	}
	return target.buffer;
}