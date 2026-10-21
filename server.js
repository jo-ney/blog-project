import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import fs from "fs/promises";

const __dirName = dirname(fileURLToPath(import.meta.url));
const filePath = __dirName + "/blog.json";

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirName + "/src/html/index.html");
});

app.post("/addblog", async (req, res) => {
    const { title, description } = req.body || {};
  
    // Validate
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).send("Title and description are required");
    }
  
    // 1. Read existing blogs (start with [] if file is empty/missing)
    try {
      let blog = [];
      try {
        const raw = await fs.readFile(filePath, "utf8");
        if (raw.trim()) {
          blog = JSON.parse(raw);
        }
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
  
      // 2. Add the new one
      blog.push({ title: title.trim(), description: description.trim() });
  
      // 3. Write the whole array back (pretty-printed)
      await fs.writeFile(filePath, JSON.stringify(blog, null, 2), "utf8");
  
      res.send("ok");
    } catch (err) {
      console.error("Failed to save blog:", err);
      res.status(500).send("Failed to save blog");
    }
  });

  app.get("/blog.json", async (req, res) => {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      res.type("application/json").send(raw.trim() ? raw : "[]");
    } catch (err) {
      if (err.code === "ENOENT") return res.json([]);
      console.error("Read failed:", err);
      res.status(500).send("Failed to read blogs");
    }
  });


  app.get("/blog/:title", async (req, res) => {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const blogs = raw.trim() ? JSON.parse(raw) : [];
  
      const blog = blogs.find(
        (b) => b.title.toLowerCase() === req.params.title.toLowerCase()
      );
  
      if (!blog) return res.status(404).json({ error: "Blog not found" });
      res.json(blog);
    } catch (err) {
      if (err.code === "ENOENT") return res.status(404).json({ error: "Blog not found" });
      console.error("Read failed:", err);
      res.status(500).send("Failed to read blogs");
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on Port : ${PORT}.`);
});
