const musicModule = require("./music/小芸音乐-0.3.0");

const qualityMap = {
  super: "super",
  standard: "standard",
  high: "high",
};

const main = async () => {
  const res = await musicModule.importMusicSheet(
    "分享曾轶可的牧羊人创建的歌单「曾轶可的牧羊人的2024年度歌单」: https://y.music.163.com/m/playlist?id=13049537742&userid=537588062&creatorId=537588062 (来自@网易云音乐)"
  );
  console.log(res);

  const item = res[1];
  const result = await musicModule.getMediaSource(item, "super");
  console.log(result);
};

main();
