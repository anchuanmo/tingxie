const express = require("express");
const path = require("path");

const tts = require("tencentcloud-sdk-nodejs-tts");
const TtsClient = tts.tts.v20190823.Client;

const app = express();
app.use(express.static(__dirname));
// 首页：直接返回同目录下的 index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 语音服务客户端（密钥从 Render 环境变量读取）
const client = new TtsClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: "ap-singapore",
  profile: {
    httpProfile: { endpoint: "tts.tencentcloudapi.com" },
  },
});

// 语速映射：慢/正常/快
function mapSpeed(speed) {
  if (speed === "slow") return -1;
  if (speed === "fast") return 1;
  return 0;
}

// 核心接口：不要改这个路径
app.get("/api/tts", async (req, res) => {
  const text = String(req.query.text || "").trim();
  const type = String(req.query.type || "zh"); // 保留参数，先不做区分也行
  const speed = String(req.query.speed || "normal");

  if (!text) {
    res.status(400).send("no text");
    return;
  }

  try {
    const params = {
      Text: text,
      SessionId: Date.now().toString(),
      Codec: "mp3",
      Speed: mapSpeed(speed),
      VoiceType: 101008, // 最稳的声音
    };

    const result = await client.TextToVoice(params);
    const audioBuffer = Buffer.from(result.Audio, "base64");

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS ERROR:", err);
    res.status(500).send("tts failed");
  }
});

// Render 必须这样监听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});