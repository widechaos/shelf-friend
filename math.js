const scale = {
  g: ["mass", 1],
  kg: ["mass", 1000],
  ml: ["volume", 1],
  L: ["volume", 1000],
  pcs: ["count", 1],
};
export function unitPrice({ price, amount, packs = 1, unit }) {
  if (!scale[unit]) throw Error("请选择支持的规格单位。");
  if (
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isInteger(packs) ||
    packs < 1
  )
    throw Error("价格不能为负，规格和件数必须大于零；件数须为整数。");
  const [dimension, multiplier] = scale[unit];
  return {
    dimension,
    baseAmount: amount * packs * multiplier,
    value:
      (price / (amount * packs * multiplier)) *
      (dimension === "count" ? 1 : 1000),
    label: dimension === "mass" ? "kg" : dimension === "volume" ? "L" : "件",
  };
}
export function compare(items) {
  const rows = items.map((x) => ({ ...x, ...unitPrice(x) }));
  if (new Set(rows.map((x) => x.dimension)).size !== 1)
    throw Error("重量、容量和件数不能直接比价。请选同类、同一计量维度的商品。");
  const sorted = rows.toSorted((a, b) => a.value - b.value);
  const best = sorted[0],
    highest = sorted.at(-1).value;
  return {
    rows,
    best,
    savings: highest === 0 ? 0 : (highest - best.value) / highest,
    tie: sorted.every((x) => Math.abs(x.value - best.value) < 1e-9),
  };
}
export function cosine(a, b) {
  if (a.length !== b.length) throw Error("Embedding dimensions differ");
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}
