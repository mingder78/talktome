let processor: MediaStreamTrackProcessor<AudioData> | null;
let reader: ReadableStreamDefaultReader<AudioData> | null;
let isRunning = false;

const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const output = document.getElementById("output") as HTMLPreElement;

// Optional: use a worker for frame processing
const worker = new Worker(new URL("./audioWorker.ts", import.meta.url), {
  type: "module",
});
const audioCtx = new AudioContext({ sampleRate: 48000 });

let playTime = 0;

worker.onmessage = (e: MessageEvent<Float32Array>) => {
  const pcm = e.data;

  // create AudioBuffer
  const buffer = audioCtx.createBuffer(1, pcm.length, 48000);

  buffer.copyToChannel(pcm, 0);

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);

  // smooth scheduling (no gaps)
  if (playTime < audioCtx.currentTime) playTime = audioCtx.currentTime;

  src.start(playTime);

  playTime += buffer.duration;
};

startBtn.onclick = async () => {
  try {
    await audioCtx.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];

    if (typeof MediaStreamTrackProcessor === "undefined") {
      alert("您的瀏覽器不支援 MediaStreamTrackProcessor");
      return;
    }

    processor = new MediaStreamTrackProcessor({ track: audioTrack });
    reader = processor.readable.getReader();

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.innerText = "狀態: 正在採集...";

    readFrames();
  } catch (err) {
    console.error("無法獲取麥克風:", err);
  }
};

function handleChunk(chunk: EncodedAudioChunk) {
  // ⭐ send chunk directly (best way)
  console.log("Opus packet:", chunk.byteLength);
  worker.postMessage(chunk);
}

async function readFrames() {
  if (!reader) return;
  const encoder = new AudioEncoder({
    output: handleChunk,
    error: console.error,
  });

  encoder.configure({
    codec: "opus", // ⭐ key
    sampleRate: 48000, // opus standard
    numberOfChannels: 1, // or 2
    bitrate: 64000, // optional
  });
  while (isRunning) {
    const { done, value: audioFrame } = await reader.read();
    if (done || !audioFrame) break;

    encoder.encode(audioFrame);
    // 處理音訊幀
    processFrame(audioFrame);
  }
}

function processFrame(frame: AudioData) {
  output.innerText = `
時間戳: ${frame.timestamp}
取樣數: ${frame.numberOfFrames}
聲道數: ${frame.numberOfChannels}
取樣率: ${frame.sampleRate} Hz
  `;
}

stopBtn.onclick = () => {
  isRunning = false;
  reader?.cancel();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.innerText = "狀態: 已停止";
};
