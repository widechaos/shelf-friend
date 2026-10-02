# Shelf Friend

A supermarket companion I built for a friend who wants to compare shelf prices and understand how a kitchen or household product would fit their use. Started October 2, 2026 for the Hacktoberfest Weekend Challenge: Build for a Friend.

## Try it

Live demo: https://widechaos.github.io/shelf-friend/

1. Enter two comparable products: the final price of the entire group, net quantity per pack, unit and number of packs. All products use the selected currency. Mass, volume and count are never mixed.
2. Ask a short question in Chinese or English. The first request downloads an approximately 118 MB multilingual open-weight model. It embeds your query locally and retrieves the closest qualifying original checklists or a cited manufacturer's guide.
3. Read the source and tradeoffs, then check the exact product's label. Retrieval similarity is not factual accuracy or a probability.

This is retrieval, not generated product advice. The deterministic calculator remains available if AI loading fails. No shopping query is sent to an inference API. Initial runtime/model downloads contact jsDelivr and Hugging Face; ordinary hosting/CDN request metadata still exists. No analytics or price-scraping services are included.

## Run locally

```sh
python3 -m http.server 18765 --bind 127.0.0.1
# Open http://127.0.0.1:18765
node --test tests/*.test.mjs
```

Use a modern browser with WASM and web workers. The service worker caches the app shell and successful runtime requests; Transformers.js also uses a model cache. Reopening offline depends on these caches surviving, and is not a guarantee on every browser/device. Models are pinned to an exact revision; runtime is pinned to Transformers.js 3.8.1. App-shell cache versions are updated with code releases; a second reload may be needed after the worker activates.

## Open-source AI at the core

The retrieval worker uses Transformers.js and the quantized ONNX conversion of `paraphrase-multilingual-MiniLM-L12-v2`. It performs mean pooling, normalization and cosine ranking in a worker. This is genuine model inference, not keyword matching. Only the highest-ranking qualifying guide is shown, to reduce loosely related secondary suggestions. Queries with no score above the prototype's conservative threshold return no guide. The small corpus is deliberately inspectable; it is not comprehensive consumer-product knowledge. Chinese/English similarity thresholds need broader evaluation before practical reliance.

- [Transformers.js](https://github.com/huggingface/transformers.js) — Apache-2.0.
- [Base model by sentence-transformers](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) — Apache-2.0.
- [ONNX conversion by Xenova](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2), revision `2c4055b12046f11709e9df2c122e59ffbdc2f900`.
- Cast-iron guide: an original concise summary of [Lodge's manufacturer guidance](https://www.lodgecastiron.com/pages/discover-cleaning-and-care-cast-iron), explicitly scoped to its seasoned cookware. All other guides are my original shopping checklists, not manufacturer instructions. No third-party guide text or imagery is copied.

## Scope and limitations

Manual shelf-price inputs, unit comparison and retrieval are implemented. No live retailer-price lookup, barcode/photo recognition, product-specific certification or generative chat is implemented. Examples use labelled demonstration prices, not retailer quotes. I have not yet handed it to my friend or collected feedback, so I do not claim a user trial. Lower unit price is not automatically the best purchase. Cleaning and appliance checklists defer to exact labels/manuals.

## Entry integrity

This project and its repository were started within the weekend entry window. The weekly challenges use separate projects. No employer code, customer data, recordings, credentials or paid services were used. Code and guide changes after the deadline will be recorded here rather than treated as part of the original entry.
