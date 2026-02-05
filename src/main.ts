// main.ts
const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

worker.onmessage = (e: MessageEvent<Float32Array>) => {
  const frame = e.data;
  console.log("Received frame", frame.length);
};

const frame = new Float32Array(1024);
// Send a single frame
worker.postMessage(frame, [frame.buffer]);
