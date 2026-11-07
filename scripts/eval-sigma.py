#!/usr/bin/env python3
"""Scores Sigma Cat on src/Portfolio.AI/evals/questions.json. Run on the server before changing the prompt or model.

  python3 scripts/eval-sigma.py                       # current prompt from the running backend
  python3 scripts/eval-sigma.py --persona persona.md  # same facts, trial persona
  python3 scripts/eval-sigma.py --model sigma-cat --no-system
"""
import argparse, json, re, subprocess, time, unicodedata, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FACTS_MARKER = "# Facts"
PHONE_VOICE = ["toi rat vui", "rat vui duoc", "xin loi", "happy to help", "glad to help", "as an ai", "la mot ai",
               "duoi day la", "i apologize", "i'm sorry", "how may i assist", "quy khach"]
OWNER_VOICE = ["toi la khoi", "toi la anh khoi", "minh la khoi", "i am khoi", "i'm khoi"]


def plain(text):
    text = text.lower().replace("đ", "d")
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def has_vietnamese(text):
    return bool(re.search(r"[ăâêôơưđàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]", text.replace("Đặng Vỹ Khôi", "").replace("Khôi", "").lower()))


def score(case, reply, done_reason):
    text = plain(reply)
    fails = []
    for needle in case.get("all", []):
        if plain(needle) not in text:
            fails.append(f"missing '{needle}'")
    if case.get("any") and not any(plain(n) in text for n in case["any"]):
        fails.append(f"none of {case['any']}")
    for needle in case.get("exact", []):
        if needle not in reply:
            fails.append(f"missing exact '{needle}'")
    for needle in case.get("none", []) + OWNER_VOICE:
        if plain(needle) in text:
            fails.append(f"forbidden '{needle}'")
    for needle in PHONE_VOICE:
        if needle in text:
            fails.append(f"phone voice '{needle}'")
    if re.search(r"[一-鿿]", reply):
        fails.append("chinese text")
    if done_reason != "stop":
        fails.append(f"cut off ({done_reason})")
    if len(reply.split()) > 55:
        fails.append("too long")
    if case["lang"] == "vi" and not has_vietnamese(reply):
        fails.append("not vietnamese")
    if case["lang"] == "en" and has_vietnamese(reply):
        fails.append("not english")
    return fails


def ask(args, system, case):
    messages = [{"role": "system", "content": system}] if system else []
    messages += [{"role": r, "content": c} for r, c in case.get("history", [])]
    question = case["q"]
    messages.append({"role": "user", "content": question})
    body = {"model": args.model, "stream": True, "think": False, "keep_alive": "-1m", "messages": messages,
            "options": json.loads(args.options)}
    request = urllib.request.Request(f"http://{args.host}:11434/api/chat", json.dumps(body).encode(),
                                     {"Content-Type": "application/json"})
    start, first, reply, final = time.time(), None, "", {}
    with urllib.request.urlopen(request, timeout=300) as response:
        for line in response:
            chunk = json.loads(line)
            piece = chunk.get("message", {}).get("content", "")
            if piece and first is None:
                first = time.time() - start
            reply += piece
            if chunk.get("done"):
                final = chunk
    return reply.strip(), first or 0, time.time() - start, final


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host")
    parser.add_argument("--model", default="qwen3.5:4b")
    parser.add_argument("--persona")
    parser.add_argument("--env", action="append", default=[], help="Chat__Setting=value for the prompt")
    parser.add_argument("--no-system", action="store_true")
    parser.add_argument("--only", help="comma separated groups")
    parser.add_argument("--options", default='{"temperature":0.3,"top_p":0.9,"top_k":40,"repeat_penalty":1.05,"num_predict":120,"num_ctx":2048,"num_thread":4,"num_gpu":20}')
    parser.add_argument("--out", default="eval-results.json")
    args = parser.parse_args()

    args.host = args.host or subprocess.check_output(
        ["docker", "inspect", "portfolio_ollama", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"], text=True).strip()
    system = ""
    if not args.no_system:
        system = subprocess.run(["docker", "exec"] + [x for e in args.env for x in ("-e", e)] + ["portfolio_backend", "dotnet", "Portfolio.API.dll", "--print-prompt"], capture_output=True, text=True, check=True).stderr.strip()
        if args.persona:
            system = Path(args.persona).read_text(encoding="utf-8").strip() + "\n\n" + system[system.index(FACTS_MARKER):]

    cases = json.loads((ROOT / "src/Portfolio.AI/evals/questions.json").read_text(encoding="utf-8"))
    if args.only:
        cases = [c for c in cases if c["group"] in args.only.split(",")]

    results = []
    for case in cases:
        reply, first, total, final = ask(args, system, case)
        fails = score(case, reply, final.get("done_reason"))
        results.append({"id": case["id"], "group": case["group"], "q": case["q"], "reply": reply, "first_s": round(first, 1),
                        "total_s": round(total, 1), "prompt_tokens": final.get("prompt_eval_count"), "fails": fails})
        print(f"{'ok ' if not fails else 'BAD'} {case['id']:<16} {first:5.1f}s {total:5.1f}s  {reply[:90]!r} {fails or ''}", flush=True)

    groups = sorted({r["group"] for r in results})
    print()
    for group in groups:
        rows = [r for r in results if r["group"] == group]
        print(f"{group:<10} {sum(not r['fails'] for r in rows)}/{len(rows)}")
    timed = results[1:] or results
    print(f"TOTAL      {sum(not r['fails'] for r in results)}/{len(results)}")
    print(f"first word avg {sum(r['first_s'] for r in timed) / len(timed):.1f}s, reply avg {sum(r['total_s'] for r in timed) / len(timed):.1f}s, prompt {results[0]['prompt_tokens']} tokens")
    Path(args.out).write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
