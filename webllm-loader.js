import * as webllm from "https://esm.run/@mlc-ai/web-llm";
window.__webllm = webllm;
window.dispatchEvent(new Event("webllm-ready"));
