self.onmessage = (e: MessageEvent<Float32Array>) => {
  const frame = e.data;
  console.log("Worker got frame", frame.length);
};
