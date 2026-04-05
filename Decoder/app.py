"""Personal testing web interface for the CJK compression pipeline."""

import json
import math
import os
from datetime import datetime

import tiktoken
from flask import Flask, render_template_string, request, jsonify

from encoder import load_encoder, build_phrase_lengths, encode
from decoder import load_decoder, decode
from efficiency_calculator import calculate_efficiency, CACHE_COST_MULTIPLIER

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTRIES_PATH = os.path.join(SCRIPT_DIR, "dictionaries.json")
SYSTEM_PROMPT_TOKENS = 2899

app = Flask(__name__)
enc = tiktoken.get_encoding("cl100k_base")

# Operation log (last 10)
op_log = []


def log_operation(op_type: str, summary: str):
    ts = datetime.now().strftime("%H:%M:%S")
    op_log.insert(0, {"time": ts, "type": op_type, "summary": summary})
    if len(op_log) > 10:
        op_log.pop()


def get_available_dictionaries():
    dicts = {"default": "dictionary.json"}
    if os.path.exists(REGISTRIES_PATH):
        with open(REGISTRIES_PATH, "r") as f:
            dicts = json.load(f)
    return dicts


def load_dict_by_id(dict_id: str):
    registry = get_available_dictionaries()
    if dict_id not in registry:
        dict_id = "default"
    dict_path = os.path.join(SCRIPT_DIR, registry[dict_id])
    with open(dict_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    encode_map = {p.lower(): c for p, c in data["encode"].items()}
    decode_map = data["decode"]
    phrase_lengths = sorted(set(len(p.split()) for p in encode_map), reverse=True)
    return encode_map, decode_map, phrase_lengths


HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Decoder — CJK Compression Tester</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
       background: #fff; color: #222; max-width: 800px; margin: 0 auto; padding: 24px; }
h1 { font-size: 22px; margin-bottom: 4px; }
h1 span { color: #888; font-weight: normal; font-size: 14px; }
hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #555; }
select, input[type=number], textarea {
  width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px;
  font-size: 14px; font-family: inherit; }
textarea { resize: vertical; min-height: 80px; }
.row { display: flex; gap: 12px; margin-bottom: 12px; }
.row > div { flex: 1; }
button {
  padding: 8px 20px; border: none; border-radius: 4px; font-size: 14px;
  font-weight: 600; cursor: pointer; margin-top: 8px; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #6b7280; color: #fff; }
.btn-secondary:hover { background: #4b5563; }
.result-box {
  background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px;
  padding: 12px; margin-top: 8px; font-size: 13px; line-height: 1.6;
  white-space: pre-wrap; display: none; }
.result-box.show { display: block; }
.stat { font-weight: 600; }
.decision-encode { color: #059669; }
.decision-plain { color: #d97706; }
.placeholder {
  background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px;
  padding: 10px; font-size: 12px; color: #92400e; margin: 12px 0; }
.log { margin-top: 8px; font-size: 12px; color: #666; }
.log-entry { padding: 2px 0; border-bottom: 1px solid #f0f0f0; }
.log-entry .time { color: #999; margin-right: 8px; }
.log-entry .type { font-weight: 600; margin-right: 6px; }
section { margin-bottom: 20px; }
</style>
</head>
<body>

<h1>Decoder <span>CJK Compression Tester</span></h1>
<hr>

<section>
<div class="row">
  <div>
    <label>Dictionary</label>
    <select id="dict">
      {% for d in dicts %}<option value="{{d}}">{{d}}</option>{% endfor %}
    </select>
  </div>
  <div>
    <label>Conversation Length</label>
    <input type="number" id="convLen" value="50" min="1">
  </div>
</div>

<label>English Input</label>
<textarea id="inputText" placeholder="Type your English text here..."></textarea>
<button class="btn-primary" onclick="analyse()">Analyse</button>
<div class="result-box" id="analyseResult"></div>
</section>

<hr>

<div class="placeholder" id="apiPlaceholder">
  API key not configured — copy encoded text above and paste to Claude manually, then paste response in box below
</div>

<section>
<label>AI Response (paste CJK here)</label>
<textarea id="aiResponse" placeholder="Paste CJK response from Claude here..."></textarea>
<button class="btn-secondary" onclick="decodeCjk()">Decode</button>
<div class="result-box" id="decodeResult"></div>
</section>

<hr>

<section>
<label>Operation Log (last 10)</label>
<div class="log" id="logBox">No operations yet.</div>
</section>

<script>
async function analyse() {
  const text = document.getElementById('inputText').value.trim();
  if (!text) return;
  const dictId = document.getElementById('dict').value;
  const convLen = parseInt(document.getElementById('convLen').value) || 50;
  const res = await fetch('/analyse', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text, dictionary_id: dictId, conversation_length: convLen})
  });
  const data = await res.json();
  const box = document.getElementById('analyseResult');
  const cls = data.decision === 'ENCODE' ? 'decision-encode' : 'decision-plain';
  let html = `<span class="${cls} stat">${data.decision}</span>\\n`;
  if (data.encoded) html += `Encoded: ${data.encoded}\\n`;
  html += `Tokens: ${data.tokens_before} → ${data.tokens_after} (saved ${data.tokens_saved})\\n`;
  html += `Break-even: ${data.break_even === -1 ? 'never' : data.break_even + ' messages'}\\n`;
  html += `Net saving: ${data.net_saving} tokens over ${convLen} messages`;
  box.innerHTML = html;
  box.classList.add('show');
  refreshLog();
}

async function decodeCjk() {
  const encoded = document.getElementById('aiResponse').value.trim();
  if (!encoded) return;
  const dictId = document.getElementById('dict').value;
  const res = await fetch('/decode', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({encoded, dictionary_id: dictId})
  });
  const data = await res.json();
  const box = document.getElementById('decodeResult');
  let html = `<span class="stat">Decoded:</span> ${data.decoded}\\n`;
  if (data.unknown_chars > 0) html += `⚠ ${data.unknown_chars} unknown character(s)`;
  box.innerHTML = html;
  box.classList.add('show');
  refreshLog();
}

async function refreshLog() {
  const res = await fetch('/log');
  const entries = await res.json();
  const box = document.getElementById('logBox');
  if (entries.length === 0) { box.innerHTML = 'No operations yet.'; return; }
  box.innerHTML = entries.map(e =>
    `<div class="log-entry"><span class="time">${e.time}</span><span class="type">${e.type}</span>${e.summary}</div>`
  ).join('');
}
</script>
</body>
</html>"""


@app.route("/")
def index():
    dicts = list(get_available_dictionaries().keys())
    return render_template_string(HTML, dicts=dicts)


@app.route("/analyse", methods=["POST"])
def analyse():
    data = request.get_json()
    text = data.get("text", "")
    dict_id = data.get("dictionary_id", "default")
    conv_len = data.get("conversation_length", 50)

    encode_map, _, phrase_lengths = load_dict_by_id(dict_id)

    efficiency = calculate_efficiency(
        text, conv_len, SYSTEM_PROMPT_TOKENS,
        encode_map, phrase_lengths, enc,
        use_caching=True,
    )

    decision = efficiency["recommendation"]
    encoded_text = None
    tokens_after = efficiency["original_tokens_per_msg"]

    if decision == "ENCODE":
        encoded_text, _ = encode(text, encode_map, phrase_lengths)
        tokens_after = len(enc.encode(encoded_text))

    be = efficiency["break_even_messages"]

    log_operation("ANALYSE", f"{decision} — {efficiency['tokens_saved_per_msg']} saved/msg [{dict_id}]")

    return jsonify({
        "decision": decision,
        "encoded": encoded_text,
        "tokens_before": efficiency["original_tokens_per_msg"],
        "tokens_after": tokens_after,
        "tokens_saved": efficiency["original_tokens_per_msg"] - tokens_after,
        "break_even": -1 if be == float("inf") else be,
        "net_saving": efficiency["net_saving"],
    })


@app.route("/decode", methods=["POST"])
def decode_endpoint():
    data = request.get_json()
    encoded = data.get("encoded", "")
    dict_id = data.get("dictionary_id", "default")

    _, decode_map, _ = load_dict_by_id(dict_id)
    decoded_text, unknown_count = decode(encoded, decode_map)

    log_operation("DECODE", f"{len(encoded)} chars → {len(decoded_text)} chars, {unknown_count} unknown")

    return jsonify({
        "decoded": decoded_text,
        "unknown_chars": unknown_count,
    })


@app.route("/log")
def get_log():
    return jsonify(op_log)


if __name__ == "__main__":
    print("Starting Decoder web interface...")
    print("Open browser to: http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
