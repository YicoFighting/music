const express = require("express");
const musicModule = require("./music/小芸音乐-0.3.0");
const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", { songs: [] });
});

app.post("/search", async (req, res) => {
  const query = req.body.query;
  try {
    const result = await musicModule.search(query, 1, "music");
    if (result.data[0].artwork) {
      res.render("index", { songs: result.data });
    } else {
      const dataWithArtwork = await Promise.all(
        result.data.map(async (item) => {
          const { artwork } = await musicModule.getMusicInfo(item);
          return {
            ...item,
            artwork,
          };
        })
      );
      res.render("index", { songs: dataWithArtwork });
    }
  } catch (error) {
    res.render("index", { songs: [] });
  }
});

app.post("/play", async (req, res) => {
  const song = req.body;
  try {
    const quality = "high";
    const mediaSource = await musicModule.getMediaSource(song, quality);
    res.json({ url: mediaSource.url });
  } catch (error) {
    res.status(500).json({ error: "Failed to get media source" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
