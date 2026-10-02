import { cosine } from "./math.js";
let pipeline, extractor, vectors;
self.onmessage = async ({ data }) => {
  const start = performance.now(),
    cached = !!extractor;
  try {
    if (!pipeline) {
      self.postMessage({ status: "下载推理运行库，购物问题仍保留在浏览器内…" });
      const lib = await import(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js"
      );
      pipeline = lib.pipeline;
      lib.env.allowLocalModels = false;
      lib.env.backends.onnx.wasm.numThreads = 1;
    }
    if (!extractor) {
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
        {
          dtype: "q8",
          revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
          progress_callback: (p) => {
            if (p.status === "progress")
              self.postMessage({
                status: `下载模型 ${p.file || ""} · ${Math.round(p.progress || 0)}%`,
              });
          },
        },
      );
      self.postMessage({ status: "模型已下载，正在为使用指南建立本地索引…" });
      const output = await extractor(
        data.guides.map((g) => g.query),
        { pooling: "mean", normalize: true },
      );
      vectors = output.tolist();
    }
    const q = await extractor(data.question, {
      pooling: "mean",
      normalize: true,
    });
    const ranked = vectors
      .map((v, index) => ({ index, score: cosine(q.data, v) }))
      .sort((a, b) => b.score - a.score);
    const results = ranked.filter((x) => x.score >= 0.35).slice(0, 1);
    self.postMessage({
      id: data.id,
      results,
      ms: performance.now() - start,
      cached,
    });
  } catch (e) {
    self.postMessage({
      id: data.id,
      error: String(e.message || e).slice(0, 180),
    });
  }
};
