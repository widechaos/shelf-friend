import test from "node:test";
import assert from "node:assert/strict";
import { compare, unitPrice, cosine } from "../math.js";
test("kg/g and multipacks use total net amount", () => {
  const r = compare([
    { name: "A", price: 2.5, amount: 2, unit: "kg", packs: 1 },
    { name: "B", price: 0.75, amount: 500, unit: "g", packs: 1 },
  ]);
  assert.equal(r.best.name, "A");
  assert.equal(r.rows[0].value, 1.25);
  assert.equal(r.rows[1].value, 1.5);
  assert.ok(Math.abs(r.savings - 1 / 6) < 1e-10);
  assert.equal(
    unitPrice({ price: 6, amount: 250, packs: 4, unit: "ml" }).value,
    6,
  );
});
test("incompatible measurements cannot produce a winner", () =>
  assert.throws(
    () =>
      compare([
        { price: 1, amount: 1, unit: "kg" },
        { price: 1, amount: 1, unit: "L" },
      ]),
    /不能直接/,
  ));
test("invalid, missing and fractional quantities are rejected", () => {
  for (const item of [
    { price: NaN, amount: 1, unit: "kg" },
    { price: -1, amount: 1, unit: "kg" },
    { price: 1, amount: 0, unit: "kg" },
    { price: 1, amount: 1, packs: 1.5, unit: "kg" },
    { price: 1, amount: 1, unit: "oz" },
  ])
    assert.throws(() => unitPrice(item));
});
test("zero-price and equal-price items do not divide by zero", () => {
  let r = compare([
    { price: 0, amount: 1, unit: "pcs" },
    { price: 0, amount: 2, unit: "pcs" },
  ]);
  assert.equal(r.savings, 0);
  assert.equal(r.tie, true);
  r = compare([
    { price: 0, amount: 1, unit: "pcs" },
    { price: 1, amount: 1, unit: "pcs" },
  ]);
  assert.equal(r.savings, 1);
});
test("cosine similarity is normalized, with zero-vector handling", () => {
  assert.equal(cosine([2, 0], [3, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  assert.throws(() => cosine([1], [1, 2]));
});
