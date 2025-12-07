# 通用搜索

```js
// 最后一个参数来自 plugin 的 supportedSearchType
const { isEnd, data } = await musicModule.search("清明雨上", 1, "music");
const item = data[0];
```

数据结构，每个插件有所不同；这个直接传给 getMediaSource 函数即可

```json
{
  "id": "eG13dnNtcw",
  "artist": "许嵩",
  "title": "清明雨上"
}
```

# 获取歌曲播放链接

```js
const { isEnd, data } = await musicModule.search("清明雨上", 1, "music");
const item = data[0];
const result = await musicModule.getMediaSource(item);
```

得到播放链接

```json
{
  "url": "http://sr.sycdn.kuwo.cn/ae93a25b8a6560e9aca8b88ee0f4c7f7/67769abe/resource/n2/79/44/1013214780.mp3"
}
```

# 获取歌词

```js
const { isEnd, data } = await musicModule.search("清明雨上", 1, "music");
const item = data[0];
const result = await musicModule.getLyric(item);
```

得到歌词

```json
{
  rawLrc: '[00:00.00] \r\n' +
    '[ti:清明雨上]\n' +
    '[ar:许嵩]\n' +
    '[al:曾经的歌系列 43]\n' +
    '[by:]\n' +
    '[offset:0]\n' +
    '[00:00.00]清明雨上 - 许嵩\n' +
    '[00:09.35]词：许嵩\n' +
    '[00:18.71]曲：许嵩\n' +
    '[00:28.06]窗透初晓 日照西桥 云自摇\n' +
    '[00:33.84]想你当年荷风微摆的衣角\n' +
    '[00:41.30]木雕鎏金 岁月涟漪 七年前封笔\n' +
    '[00:47.52]因为我今生挥毫只为你\n' +
    '[00:54.47]雨打湿了眼眶 年年倚井盼归堂\n' +
    '[01:01.07]最怕不觉泪已拆两行\n' +
    '[01:06.94]我在人间彷徨 寻不到你的天堂\n' +
    '[01:13.47]东瓶西镜放 恨不能遗忘\n' +
    '[01:20.16]又是清明雨上 折菊寄到你身旁\n' +
    '[01:27.20]把你最爱的歌来轻轻唱\n' +
    '[01:47.48]远方有琴 愀然空灵 声声催天雨\n' +
    '[01:54.08]涓涓心事说给自己听\n' +
    '[02:00.66]月影憧憧 烟火几重 烛花红\n' +
    '[02:07.32]红尘旧梦 梦断都成空\n' +
    '[02:13.91]雨打湿了眼眶 年年倚井盼归堂\n' +
    '[02:20.56]最怕不觉泪已拆两行\n' +
    '[02:26.37]我在人间彷徨 寻不到你的天堂\n' +
    '[02:32.95]东瓶西镜放 恨不能遗忘\n' +
    '[02:39.53]又是清明雨上 折菊寄到你身旁\n' +
    '[02:46.60]把你最爱的歌来轻轻唱\n' +
    '[02:52.33]我在人间彷徨 寻不到你的天堂\n' +
    '[02:59.41]东瓶西镜放 恨不能遗忘\n' +
    '[03:06.00]又是清明雨上 折菊寄到你身旁\n' +
    '[03:13.03]把你最爱的歌来轻轻唱\n'
}
```

# 获取排行榜

```js
const topList = await musicModule.getTopLists();
const topListItem = topList[0].data[0];
const topListDetail = await musicModule.getTopListDetail(topListItem);
```

获取排行榜

```json
{
  "id": "new",
  "title": "新歌榜",
  "description": "每日同步官方数据。更新时间：2025-01-02",
  "musicList": [
    {
      "id": "eHhoZG5zbm54",
      "title": undefined,
      "artist": "周深 - 总有美好在路上"
    },
    {
      "id": "eHhobWtkeHd3",
      "title": undefined,
      "artist": "马健涛 - 搀扶 (DJ伟然版)"
    },
    ...
  ]
}
```

# 推荐歌单

```js
const { data } = await musicModule.getRecommendSheetTags();
const type = data[0];
const item = type.data[0];
const result = await musicModule.getRecommendSheetsByTag(item, 1);
const sheet = result.data[0];
const sheetInfo = await musicModule.getMusicSheetInfo(sheet, 1);
const { url } = await musicModule.getMediaSource(
  sheetInfo.musicList[0],
  "high"
);
console.log(url);
```

sheet 对应的数据结构

```json
{
  "sheetItem": {
    "description": "此曲只应人间有，拯救各种不开心， n考试不会了来一首， n游戏被队友坑了来一首， n情侣劈腿被你一踢而 去时来一首， n熬夜加班眼冒金星腰酸背痛时来一首， n儿时理想被残酷现实打的面目全非时来五首， n剩下那一首是属于我的， 每个人都有一首属于自己的电音。你呢。 n n"
  },
  "musicList": [
    { "id": "Y2h3ZGNzdw", "title": "Vexento", "artist": "Masked Heroes" },
    { "id": "Y3NubmNrbg", "title": "Axero", "artist": "Fire" },
    { "id": "Y2h4a2R2aw", "title": "Axero", "artist": "Here" },
    { "id": "Y2hubWRjdg", "title": "Axero", "artist": "Waves (Radio Edit)" },
    { "id": "dndzc2hrd3c", "title": "Axero", "artist": "Climb" },
    {
      "id": "Y3N3a2hkZA",
      "title": "Axero",
      "artist": "Struggle (Original Mix)"
    },
    { "id": "Y3N3a2hkeA", "title": "Axero", "artist": "Trip (Original Mix)" },
    {
      "id": "Y2hubXhubQ",
      "title": "Axero",
      "artist": "Unity (Extended Mix)"
    }
  ],
  "isEnd": true
}
```

# 获取专辑

```js
const { data } = await musicModule.search("班得瑞", 1, "album");
const albumItem = data[0];
const { musicList } = await musicModule.getAlbumInfo(albumItem, 1);
const { url } = await musicModule.getMediaSource(musicList[0]);
```

得到 musicList 如下

```json
[
  {
    "id": "20",
    "title": "雪之梦",
    "artist": "班得瑞",
    "album": "班得瑞轻音乐精选 "
  },
  {
    "id": "21",
    "title": "童年(空灵悠远)",
    "artist": "班得瑞",
    "album": "班得瑞轻音乐精选 "
  },
  {
    "id": "22",
    "title": "初雪",
    "artist": "班得瑞",
    "album": "班得瑞轻音乐精选 "
  }
]
```

# 获取作者歌曲

```js
const { data } = await musicModule.search("班得瑞", 1, "artist");
const type = data[0];
const item = await musicModule.getArtistWorks(type, 1, "music");
const { url } = await musicModule.getMediaSource(item.data[0], "standard");
console.log(url);
```

得到作者歌曲如下

```json
{
  "isEnd": false,
  "artistItem": {
    "description": "班得瑞的音乐唯美、宁静，简单流畅的旋律，加入大自然意向与流行元素，使人悠然神往。班得瑞的音乐强调 轻柔的绝对性，以清爽的配器构架出没有压力、没有负担的乐曲，加之高超的录音技术，使得音乐具有空灵感，溶入耳朵的不只是 山林溪水的清新感受，更可以明显放松紧崩的神经，是难得一见的音乐珍品。"
  },
  "data": [
    {
      "id": "33",
      "artist": "班得瑞",
      "title": "清晨",
      "album": "班得瑞轻音乐精选"
    }
  ]
}
```

# 获取歌单

```js
const res = await musicModule.search("许嵩", 1, "sheet");
const sheet = res.data[0];
const info = await musicModule.getMusicSheetInfo(sheet, 1);
```

歌单的数据结构

```json
{
  "isEnd": false,
  "musicList": [
    {
      "id": "315008",
      "artwork": "http://cdnmusic.migu.cn/picture/2022/0525/2035/AS4208ff2d51fd85ce98b8989db7fe35ad.jpg",
      "title": "七号公园",
      "artist": "许嵩",
      "album": "V",
      "copyrightId": "60058623027",
      "singerId": "18196"
    },
    {
      "id": "314996",
      "artwork": "http://cdnmusic.migu.cn/picture/2023/1008/1749/AS4479cbf51f2783f6659d08e92e314661.jpg",
      "title": "尘世美",
      "artist": "许嵩",
      "album": "半城烟沙",
      "copyrightId": "6005861HXDM",
      "singerId": "18196"
    }
  ]
}
```

# 导入歌单

```js
const res = await musicModule.importMusicSheet(
  "分享xxx创建的歌单「xxx的2024年度歌单」: https://y.music.163.com/m/playlist?id=1&userid=2&creatorId=3 (来自@网易云音乐)"
);
const item = res[1];
const result = await musicModule.getMediaSource(item, "super");
console.log(result);
```

歌单数据

```json
[
  {
    id: 2166087862,
    artwork: 'https://p2.music.126.net/YaOGrLmbuvE6paR11hNsjg==/109951169685621597.jpg',
    title: '河',
    artist: '何浩楠',
    album: '河',
    url: 'https://share.duanx.cn/url/wy/2166087862/128k',
    qualities: {
      low: [Object],
      standard: [Object],
      high: [Object],
      super: [Object]
    },
    copyrightId: 0
  }
]
```
