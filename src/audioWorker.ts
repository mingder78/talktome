let decoder: AudioDecoder;

decoder = new AudioDecoder({
  output: handleDecodedAudio,
  error: console.error,
});

decoder.configure({
  codec: "opus",
  sampleRate: 48000,
  numberOfChannels: 1,
});

self.onmessage = (event: MessageEvent<EncodedAudioChunk>) => {
  const chunk = event.data;

  // ⭐ decode opus packet
  decoder.decode(chunk);
};

function handleDecodedAudio(audioData: AudioData) {
  // Convert to PCM
  const pcm = new Float32Array(audioData.numberOfFrames);

  audioData.copyTo(pcm, {
    planeIndex: 0,
    format: "f32",
  });

  // Now you have raw samples
  console.log("decoded frames:", pcm.length);

  // send back if needed
  self.postMessage(pcm, [pcm.buffer]);

  audioData.close();
}
