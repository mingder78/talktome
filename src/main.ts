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

console.log(worker);

startBtn.onclick = async () => {
  try {
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

async function readFrames() {
  if (!reader) return;

  while (isRunning) {
    const { done, value: audioFrame } = await reader.read();
    if (done || !audioFrame) break;

    // 處理音訊幀
    processFrame(audioFrame);

    // Optional: send to worker
    worker.postMessage(audioFrame);
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
