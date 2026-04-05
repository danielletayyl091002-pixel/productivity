"""Personal testing web interface for the CJK compression pipeline."""

import json
import os
import uuid
from datetime import datetime

import tiktoken
from flask import Flask, render_template_string, request, jsonify, Response

from encoder import load_encoder, build_phrase_lengths, encode
from decoder import load_decoder, decode
from efficiency_calculator import calculate_efficiency

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTRIES_PATH = os.path.join(SCRIPT_DIR, "dictionaries.json")
HISTORY_PATH = os.path.join(SCRIPT_DIR, "history.json")
SYSTEM_PROMPT_PATH = os.path.join(SCRIPT_DIR, "system_prompt.txt")
SYSTEM_PROMPT_TOKENS = 2899
MAX_HISTORY = 100

app = Flask(__name__)
enc = tiktoken.get_encoding("cl100k_base")


# ── History persistence ───────────────────────────────────────────────────

def load_history() -> list:
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_history(history: list):
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_history_entry(entry: dict):
    history = load_history()
    entry["id"] = str(uuid.uuid4())[:8]
    entry["timestamp"] = datetime.now().strftime("%b %d %H:%M")
    history.insert(0, entry)
    if len(history) > MAX_HISTORY:
        history = history[:MAX_HISTORY]
    save_history(history)


# ── Dictionary helpers ────────────────────────────────────────────────────

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


# ── HTML ──────────────────────────────────────────────────────────────────

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
.btn-copy { background: #e5e7eb; color: #333; padding: 4px 10px; font-size: 12px;
            margin-top: 0; border-radius: 3px; }
.btn-copy:hover { background: #d1d5db; }
.btn-copy.success { background: #d1fae5; color: #059669; }
.btn-copy.fail { background: #fee2e2; color: #dc2626; }
.btn-danger { background: #dc2626; color: #fff; padding: 4px 10px; font-size: 12px; margin-top: 0; }
.btn-danger:hover { background: #b91c1c; }
.btn-danger-lg { background: #dc2626; color: #fff; }
.btn-danger-lg:hover { background: #b91c1c; }
.result-box {
  background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px;
  padding: 12px; margin-top: 8px; font-size: 13px; line-height: 1.6;
  white-space: pre-wrap; display: none; position: relative; }
.result-box.show { display: block; }
.result-box .copy-row { position: absolute; top: 8px; right: 8px; }
.stat { font-weight: 600; }
.decision-encode { color: #059669; }
.decision-plain { color: #d97706; }
.placeholder {
  background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px;
  padding: 10px; font-size: 12px; color: #92400e; margin: 12px 0;
  display: flex; justify-content: space-between; align-items: center; }
section { margin-bottom: 20px; }
.label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.label-row label { margin-bottom: 0; }
.label-row .input-btns { display: flex; gap: 4px; }

/* Tabs */
.tabs { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid #e0e0e0; }
.tab { padding: 8px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
       border: none; background: none; color: #888; border-bottom: 2px solid transparent;
       margin-bottom: -2px; }
.tab.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-content { display: none; }
.tab-content.active { display: block; }

/* History cards */
.history-card {
  background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px;
  padding: 12px; margin-bottom: 10px; font-size: 13px; position: relative;
  cursor: pointer; transition: border-color 0.15s; }
.history-card:hover { border-color: #2563eb; }
.history-card .card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.history-card .card-meta { color: #888; font-size: 11px; }
.history-card .card-op { font-weight: 700; font-size: 12px; }
.history-card .card-op.encode { color: #059669; }
.history-card .card-op.plain { color: #d97706; }
.history-card .card-body { line-height: 1.5; }
.history-card .card-body .field { margin-bottom: 2px; }
.history-card .card-body .field-label { color: #888; font-size: 11px; }
.history-card .card-actions { display: flex; gap: 6px; margin-top: 8px; }
.history-card .delete-btn { position: absolute; top: 8px; right: 8px; }
.history-empty { color: #999; font-size: 14px; text-align: center; padding: 40px 0; }
.history-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.history-top .count { color: #888; font-size: 13px; }
.info-banner {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px;
  padding: 10px 32px 10px 12px; font-size: 12px; color: #1e40af; margin-bottom: 16px;
  position: relative; line-height: 1.5; }
.info-banner .dismiss { position: absolute; top: 6px; right: 8px; background: none;
  border: none; font-size: 14px; color: #93c5fd; cursor: pointer; padding: 0; margin: 0; }
.info-banner .dismiss:hover { color: #1e40af; }
.tooltip-wrap { position: relative; display: inline-block; }
.tooltip-icon { display: inline-block; width: 15px; height: 15px; border-radius: 50%;
  background: #e5e7eb; color: #666; font-size: 10px; text-align: center; line-height: 15px;
  cursor: help; margin-left: 4px; vertical-align: middle; }
.tooltip-text { visibility: hidden; position: absolute; bottom: 125%; left: 50%;
  transform: translateX(-50%); background: #1f2937; color: #fff; font-size: 11px;
  font-weight: 400; padding: 8px 10px; border-radius: 4px; width: 260px; z-index: 10;
  line-height: 1.4; }
.tooltip-wrap:hover .tooltip-text { visibility: visible; }
.result-hint { font-size: 12px; color: #888; margin-top: 6px; display: none; }
.result-hint.show { display: block; }
</style>
</head>
<body>

<h1>Decoder <span>Reduce your AI API token costs automatically</span></h1>

<div class="tabs">
  <button class="tab active" onclick="switchTab('compress')">Compress</button>
  <button class="tab" onclick="switchTab('history')">History</button>
</div>

<!-- TAB 1: Compress -->
<div class="tab-content active" id="tab-compress">

<div class="info-banner" id="howItWorks">
  How it works: Type your AI prompt below &rarr; Click Analyse &rarr; If encoding saves tokens, copy the compressed output &rarr; Paste into Claude with the System Prompt &rarr; Paste Claude's response back &rarr; Click Decode to read it.
  <button class="dismiss" onclick="this.parentElement.style.display='none'">&times;</button>
</div>

<section>
<div class="row">
  <div>
    <label>Dictionary <span class="tooltip-wrap"><span class="tooltip-icon">?</span><span class="tooltip-text">Select your compression dictionary. 'default' works for general AI prompts. Custom dictionaries are optimised for specific industries like customer support or e-commerce.</span></span></label>
    <select id="dict">
      {% for d in dicts %}<option value="{{d}}">{{d}}</option>{% endfor %}
    </select>
  </div>
  <div>
    <label>Conversation Length <span class="tooltip-wrap"><span class="tooltip-icon">?</span><span class="tooltip-text">How many messages will you send in this conversation? More messages = more token savings. Break-even is typically 27-33 messages with caching enabled.</span></span></label>
    <input type="number" id="convLen" value="50" min="1">
  </div>
</div>

<div class="label-row">
  <label>English Input</label>
  <div class="input-btns">
    <button class="btn-copy" onclick="copyInputBox('inputText', this)">Copy</button>
    <button class="btn-copy" onclick="document.getElementById('inputText').value=''">Clear</button>
  </div>
</div>
<textarea id="inputText" placeholder="Type your AI prompt here — works best with structured commands like 'please generate a report about...' or 'analyze the following...'"></textarea>
<button class="btn-primary" onclick="analyse()">Analyse</button>
<div class="result-box" id="analyseResult">
  <div class="copy-row"><button class="btn-copy" onclick="copyEncoded(event)">Copy Encoded</button></div>
  <div id="analyseContent"></div>
</div>
<div class="result-hint" id="analyseHint"></div>
</section>

<hr>

<div id="apiPlaceholder" style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:8px 12px;font-size:12px;color:#6b7280;margin:12px 0;display:flex;justify-content:space-between;align-items:center;">
  <span>&#9881; Setup: Add your Anthropic API key to .env to enable automatic mode. Currently in manual mode.</span>
  <button class="btn-copy" onclick="copySystemPrompt(this)">Copy System Prompt</button>
</div>

<section>
<div class="label-row">
  <label>AI Response (paste CJK here)</label>
  <div class="input-btns">
    <button class="btn-copy" onclick="copyInputBox('aiResponse', this)">Copy</button>
    <button class="btn-copy" onclick="document.getElementById('aiResponse').value=''">Clear</button>
  </div>
</div>
<textarea id="aiResponse" placeholder="After sending your encoded prompt to Claude, paste Claude's response here to decode it back to plain English."></textarea>
<button class="btn-secondary" onclick="decodeCjk()">Decode</button>
<div class="result-box" id="decodeResult">
  <div class="copy-row"><button class="btn-copy" onclick="copyDecoded(event)">Copy Decoded</button></div>
  <div id="decodeContent"></div>
</div>
</section>

</div>

<!-- TAB 2: History -->
<div class="tab-content" id="tab-history">
  <div class="history-top">
    <span class="count" id="historyCount"></span>
    <button class="btn-danger-lg" onclick="clearAllHistory()" id="clearAllBtn" style="display:none;">Clear All History</button>
  </div>
  <div id="historyList"></div>
</div>

<script>
let lastEncodedText = '';
let lastDecodedText = '';

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`.tab[onclick="switchTab('${name}')"]`).classList.add('active');
  if (name === 'history') refreshHistory();
}

function flashCopy(btn, success) {
  const orig = btn.textContent;
  if (success) {
    btn.textContent = 'Copied \\u2713';
    btn.classList.add('success');
  } else {
    btn.textContent = 'Failed \\u2014 select manually';
    btn.classList.add('fail');
  }
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('success', 'fail'); }, 2000);
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => flashCopy(btn, true)).catch(() => flashCopy(btn, false));
}

function copyInputBox(id, btn) {
  const text = document.getElementById(id).value;
  if (!text) return;
  copyToClipboard(text, btn);
}

function copyEncoded(e) {
  e.stopPropagation();
  copyToClipboard(lastEncodedText, e.target);
}

function copyDecoded(e) {
  e.stopPropagation();
  copyToClipboard(lastDecodedText, e.target);
}

async function copySystemPrompt(btn) {
  try {
    const res = await fetch('/system-prompt');
    const text = await res.text();
    copyToClipboard(text, btn);
  } catch { flashCopy(btn, false); }
}

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
  const content = document.getElementById('analyseContent');
  const cls = data.decision === 'ENCODE' ? 'decision-encode' : 'decision-plain';
  lastEncodedText = data.encoded || '';
  let html = `<span class="${cls} stat">${data.decision}</span>\\n`;
  if (data.encoded) html += `Encoded: ${data.encoded}\\n`;
  html += `Tokens: ${data.tokens_before} \\u2192 ${data.tokens_after} (saved ${data.tokens_saved})\\n`;
  html += `Break-even: ${data.break_even === -1 ? 'never' : data.break_even + ' messages'}\\n`;
  html += `Net saving: ${data.net_saving} tokens over ${convLen} messages`;
  content.innerHTML = html;
  box.classList.add('show');
  const hint = document.getElementById('analyseHint');
  if (data.decision === 'ENCODE') {
    hint.innerHTML = '\\u2713 Encoding saves tokens for this conversation length. Copy the encoded text and paste to Claude with the System Prompt.';
    hint.style.color = '#059669';
  } else {
    hint.innerHTML = '\\u2192 Plain English is more efficient for this conversation length. Send your original text directly to Claude.';
    hint.style.color = '#888';
  }
  hint.classList.add('show');
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
  const content = document.getElementById('decodeContent');
  lastDecodedText = data.decoded || '';
  let html = `<span class="stat">Decoded:</span> ${data.decoded}\\n`;
  if (data.unknown_chars > 0) html += `\\u26a0 ${data.unknown_chars} unknown character(s)`;
  content.innerHTML = html;
  box.classList.add('show');
}

async function refreshHistory() {
  const res = await fetch('/history');
  const entries = await res.json();
  const list = document.getElementById('historyList');
  const countEl = document.getElementById('historyCount');
  const clearBtn = document.getElementById('clearAllBtn');

  countEl.textContent = `${entries.length} entries`;
  clearBtn.style.display = entries.length > 0 ? 'inline-block' : 'none';

  if (entries.length === 0) {
    list.innerHTML = '<div class="history-empty">No history yet.<br>Run your first compression on the Compress tab to see results here.<br><span style="font-size:20px;cursor:pointer" onclick="switchTab(\\\'compress\\\')">&larr; Compress</span></div>';
    return;
  }

  list.innerHTML = entries.map(e => {
    const opCls = e.decision === 'ENCODE' ? 'encode' : 'plain';
    const encodedField = e.encoded ? `<div class="field"><span class="field-label">Encoded:</span> ${e.encoded}</div>` : '';
    const decodedField = e.decoded ? `<div class="field"><span class="field-label">Decoded:</span> ${e.decoded}</div>` : '';
    const decodedBtnCls = e.decoded ? 'btn-copy' : 'btn-copy" disabled style="opacity:0.4;cursor:default';
    return `<div class="history-card" onclick="fillFromHistory('${e.id}')">
      <button class="btn-danger delete-btn" onclick="deleteEntry(event,'${e.id}')">\\u2715</button>
      <div class="card-header">
        <span class="card-op ${opCls}">${e.operation} — ${e.decision}</span>
        <span class="card-meta">${e.timestamp} | ${e.dictionary} | ${e.tokens_before}\\u2192${e.tokens_after} (saved ${e.tokens_saved})</span>
      </div>
      <div class="card-body">
        <div class="field"><span class="field-label">Input:</span> ${e.input}</div>
        ${encodedField}${decodedField}
      </div>
      <div class="card-actions">
        <button class="${e.encoded ? 'btn-copy' : 'btn-copy" disabled style="opacity:0.4;cursor:default'}" onclick="copyCardText(event,'${(e.encoded||'').replace(/'/g,"\\\\'")}')">Copy Encoded</button>
        <button class="${decodedBtnCls}" onclick="copyCardText(event,'${(e.decoded||'').replace(/'/g,"\\\\'")}')">Copy Decoded</button>
      </div>
    </div>`;
  }).join('');
}

function copyCardText(e, text) {
  e.stopPropagation();
  if (!text) return;
  copyToClipboard(text, e.target);
}

async function fillFromHistory(id) {
  const res = await fetch('/history');
  const entries = await res.json();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  document.getElementById('inputText').value = entry.input;
  switchTab('compress');
}

async function deleteEntry(e, id) {
  e.stopPropagation();
  await fetch('/history/' + id, {method: 'DELETE'});
  refreshHistory();
}

async function clearAllHistory() {
  const res = await fetch('/history');
  const entries = await res.json();
  if (!confirm(`Are you sure? This will delete all ${entries.length} entries. This cannot be undone.`)) return;
  await fetch('/history', {method: 'DELETE'});
  refreshHistory();
}
</script>
</body>
</html>"""


# ── Routes ────────────────────────────────────────────────────────────────

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
    tokens_saved = efficiency["original_tokens_per_msg"] - tokens_after

    # Save to history
    add_history_entry({
        "operation": "ANALYSE",
        "dictionary": dict_id,
        "input": text,
        "encoded": encoded_text,
        "tokens_before": efficiency["original_tokens_per_msg"],
        "tokens_after": tokens_after,
        "tokens_saved": tokens_saved,
        "decision": decision,
        "decoded": None,
    })

    return jsonify({
        "decision": decision,
        "encoded": encoded_text,
        "tokens_before": efficiency["original_tokens_per_msg"],
        "tokens_after": tokens_after,
        "tokens_saved": tokens_saved,
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

    tokens_before = len(enc.encode(encoded))
    tokens_after = len(enc.encode(decoded_text))

    # Save to history
    add_history_entry({
        "operation": "DECODE",
        "dictionary": dict_id,
        "input": encoded,
        "encoded": encoded,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_saved": tokens_before - tokens_after,
        "decision": "DECODE",
        "decoded": decoded_text,
    })

    return jsonify({
        "decoded": decoded_text,
        "unknown_chars": unknown_count,
    })


@app.route("/system-prompt")
def get_system_prompt():
    with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content, mimetype="text/plain")


@app.route("/history")
def get_history():
    return jsonify(load_history())


@app.route("/history/<entry_id>", methods=["DELETE"])
def delete_history_entry(entry_id):
    history = load_history()
    history = [e for e in history if e.get("id") != entry_id]
    save_history(history)
    return jsonify({"status": "deleted"})


@app.route("/history", methods=["DELETE"])
def clear_history():
    save_history([])
    return jsonify({"status": "cleared"})


if __name__ == "__main__":
    print("Starting Decoder web interface...")
    print("Open browser to: http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
