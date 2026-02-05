// src/audioWorker.ts
self.onmessage = (event: MessageEvent<AudioData>) => {
  const frame = event.data as AudioData;

  // 可以在這裡做編碼、視覺化或其他計算
  console.log("Worker got frame:", frame.numberOfFrames, frame.sampleRate);

  frame.close(); // 記得釋放
};
