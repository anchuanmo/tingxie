const express = require("express");
const path = require("path");

const tts = require("tencentcloud-sdk-nodejs-tts");
const TtsClient = tts.tts.v20190823.Client;

const app = express();
app.use(express.static(path.join(__dirname)));

const client = new TtsClient({
  credential: {
   secretId: process.env.TENCENT_SECRET_ID,
   secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: "ap-singapore",
  profile: { httpProfile: { endpoint: "tts.tencentcloudapi.com" } },
});

function mapSpeed(speed){
  // 腾讯云速度一般是数值；这里简单映射
  if (speed === "slow") return -1;
  if (speed === "fast") return 1;
  return 0;
}

app.get("/api/tts", async (req, res) => {
  const text = String(req.query.text || "").trim();
  const type = String(req.query.type || "zh"); // zh / en
  const speed = String(req.query.speed || "normal");

  if (!text) return res.status(400).send("text required");

  try{
    const params = {
      Text: text,
      SessionId: String(Date.now()),
      Codec: "mp3",
      Speed: mapSpeed(speed),
      // 下面两个值不同账号可能略不同：VoiceType你可先用默认常见值
      // 中文/英文可以换不同VoiceType（后续再优化）
      VoiceType: type === "en" ? 1050 : 101016,
    };

    const resp = await client.TextToVoice(params);

    // 返回的是 base64 音频
    const buf = Buffer.from(resp.Audio, "base64");
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buf);
  }catch(e){
    console.error("腾讯云返回的错误是：", e);
    res.status(500).send("tts failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("已启动，端口：", PORT);
});