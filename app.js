import { compare } from "./math.js";
const $ = (s) => document.querySelector(s);
let serial = 0;
function addProduct(item = {}) {
  const id = ++serial;
  const wrap = document.createElement("div");
  wrap.className = "product";
  wrap.innerHTML = `<div class="product-top"><input aria-label="商品 ${id} 名称" maxlength="80" placeholder="商品名称"><button class="remove" aria-label="移除商品 ${id}">×</button></div><div class="fields"><label>整组价格<input type="number" inputmode="decimal" min="0" step="any" data-f="price" placeholder="0.00"></label><label>每包净含量<input type="number" inputmode="decimal" min="0" step="any" data-f="amount" placeholder="500"></label><label>单位<select data-f="unit"><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="pcs">件</option></select></label><label>包 / 件组数<input type="number" inputmode="numeric" min="1" step="1" value="1" data-f="packs"></label></div>`;
  wrap.querySelector("input").value = item.name || "";
  for (const key of ["price", "amount", "unit", "packs"])
    if (item[key] !== undefined)
      wrap.querySelector(`[data-f="${key}"]`).value = item[key];
  wrap.querySelector(".remove").onclick = () => {
    if ($("#products").children.length <= 2) {
      $("#price-result").textContent = "至少保留两款商品才能比较。";
      return;
    }
    wrap.remove();
    renderPrice();
  };
  wrap.oninput = renderPrice;
  $("#products").append(wrap);
}
function readProducts() {
  return [...$("#products").children].map((row, i) => {
    const get = (k) => row.querySelector(`[data-f="${k}"]`).value;
    return {
      name: row.querySelector("input").value.trim() || `商品 ${i + 1}`,
      price: get("price") === "" ? NaN : Number(get("price")),
      amount: Number(get("amount")),
      packs: Number(get("packs")),
      unit: get("unit"),
    };
  });
}
function renderPrice() {
  const target = $("#price-result");
  target.replaceChildren();
  target.classList.remove("error");
  try {
    const r = compare(readProducts());
    const currency = $("#currency").value;
    const h = document.createElement("strong");
    h.textContent = r.tie ? "单价相同" : `${r.best.name} · 单价更低`;
    target.append(h);
    const lines = document.createElement("div");
    lines.className = "price-lines";
    for (const row of r.rows) {
      const p = document.createElement("div");
      p.textContent = `${row.name}：${row.value.toFixed(4)} ${currency} / ${row.label}`;
      lines.append(p);
    }
    target.append(lines);
    const p = document.createElement("div");
    p.textContent = r.tie
      ? "再看用途、质量、储存空间和能否用完。"
      : `较最高单价低 ${(r.savings * 100).toFixed(1)}%。只比较输入价格，不代表性能排名。`;
    target.append(p);
  } catch (e) {
    target.classList.add("error");
    target.textContent = Number.isNaN(
      readProducts().find((x) => Number.isNaN(x.price))?.price,
    )
      ? "填入每款的价格和净含量，即时查看换算结果。"
      : e.message;
  }
}
addProduct();
addProduct();
$("#currency").onchange = renderPrice;
$("#add").onclick = () => {
  if ($("#products").children.length >= 4) return;
  addProduct();
};
$("#example").onclick = () => {
  $("#products").replaceChildren();
  addProduct({
    name: "大包装大米",
    price: 2.5,
    amount: 2,
    unit: "kg",
    packs: 1,
  });
  addProduct({
    name: "小包装大米",
    price: 0.75,
    amount: 500,
    unit: "g",
    packs: 1,
  });
  renderPrice();
};
let worker,
  busy = false,
  latestRequest = 0;
const guides = await (await fetch("./guides.json")).json();
function showAnswer(items) {
  const target = $("#guide-result");
  target.replaceChildren();
  if (!items.length) {
    target.textContent =
      "指南库没有足够相关的内容。请检查商品标签或厂商说明，不用不相关的指南代替答案。";
    return;
  }
  for (const { index, score } of items) {
    const g = guides[index],
      article = document.createElement("article");
    article.className = "answer";
    const title = document.createElement("h3");
    title.textContent = g.title;
    const type = document.createElement("div");
    type.className = "source-label";
    type.textContent = `${g.kind} · 模型相似度 ${score.toFixed(2)}（不是正确率）`;
    const body = document.createElement("p");
    body.textContent = g.body;
    const trades = document.createElement("div");
    trades.className = "tradeoffs";
    for (const [label, text] of [
      ["适合的理由", g.pros],
      ["需要权衡", g.cons],
    ]) {
      const cell = document.createElement("div"),
        b = document.createElement("b"),
        p = document.createElement("p");
      b.textContent = label;
      p.textContent = text;
      cell.append(b, p);
      trades.append(cell);
    }
    article.append(type, title, body, trades);
    const source = g.source
      ? document.createElement("a")
      : document.createElement("p");
    source.textContent = g.sourceName;
    if (g.source) {
      source.href = g.source;
      source.target = "_blank";
      source.rel = "noopener";
    }
    article.append(source);
    target.append(article);
  }
}
async function ask() {
  if (busy) return;
  const question = $("#question").value.trim();
  if (!question) {
    $("#model-status").textContent = "请先写下商品和想了解的用途。";
    $("#question").focus();
    return;
  }
  if (question.length > 350) {
    $("#model-status").textContent =
      "请把问题缩短到 350 个字符以内，聚焦一个商品与用途。";
    return;
  }
  busy = true;
  $("#guide-result").replaceChildren();
  $("#ask").disabled = true;
  $("#question").readOnly = true;
  for (const b of document.querySelectorAll("[data-q]")) b.disabled = true;
  $("#model-status").textContent = "正在准备本地模型，问题不会发给推理服务器…";
  if (!worker) {
    worker = new Worker(new URL("./retrieval-worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      if (data.status) {
        $("#model-status").textContent = data.status;
        return;
      }
      if (data.id !== latestRequest) return;
      busy = false;
      $("#ask").disabled = false;
      $("#question").readOnly = false;
      for (const b of document.querySelectorAll("[data-q]")) b.disabled = false;
      if (data.error) {
        $("#model-status").textContent =
          `模型暂不可用：${data.error}。价格换算仍可使用；请稍后再试。`;
        worker.terminate();
        worker = null;
        return;
      }
      showAnswer(data.results);
      $("#model-status").textContent =
        `本地 AI 已完成 · ${(data.ms / 1000).toFixed(1)} 秒 · ${data.cached ? "模型已就绪" : "模型首次加载完成"} · 无服务端推理`;
    };
    worker.onerror = () => {
      busy = false;
      $("#ask").disabled = false;
      $("#question").readOnly = false;
      for (const b of document.querySelectorAll("[data-q]")) b.disabled = false;
      $("#model-status").textContent =
        "本地模型加载失败，请检查浏览器兼容性或网络；价格换算仍可使用。";
      worker.terminate();
      worker = null;
    };
  }
  latestRequest++;
  worker.postMessage({ id: latestRequest, question, guides });
}
$("#ask").onclick = ask;
for (const button of document.querySelectorAll("[data-q]"))
  button.onclick = () => {
    $("#question").value = button.dataset.q;
    ask();
  };
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});
