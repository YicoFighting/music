const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 定义文件路径
const musicJsonPath = path.join(__dirname, "music.json");
const musicFolder = path.join(__dirname, "music");

// 检查 music 文件夹是否存在，不存在则创建
if (!fs.existsSync(musicFolder)) {
  fs.mkdirSync(musicFolder);
}

// 读取 JSON 文件
fs.readFile(musicJsonPath, "utf8", async (err, data) => {
  if (err) {
    console.error("读取 music.json 文件失败:", err);
    return;
  }

  try {
    const musicData = JSON.parse(data);

    // 遍历 plugins 数组
    for (const plugin of musicData.plugins) {
      const { name, url, version } = plugin;

      if (!name || !url || !version) {
        console.warn("插件数据不完整，跳过:", plugin);
        continue;
      }

      // 生成文件名和路径
      const fileName = `${name}-${version}`;
      const filePath = path.join(musicFolder, fileName);

      // 下载文件
      try {
        console.log(`开始下载: ${url}`);
        await downloadFile(url, filePath + ".js");
        console.log(`文件已下载: ${filePath}`);
      } catch (downloadError) {
        console.error(`下载失败 (${url}):`, downloadError.message);
      }
    }
  } catch (parseError) {
    console.error("解析 music.json 文件失败:", parseError);
  }
});

// 使用 axios 下载文件的函数
async function downloadFile(fileUrl, savePath) {
  const response = await axios({
    method: "get",
    url: fileUrl,
    responseType: "stream", // 确保响应是流
  });

  // 将流写入文件
  const writer = fs.createWriteStream(savePath);

  // 管道操作：将响应流写入文件
  response.data.pipe(writer);

  // 返回一个 Promise，确保文件下载完成
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", (err) => {
      fs.unlink(savePath, () => {}); // 下载失败时删除部分文件
      reject(err);
    });
  });
}
