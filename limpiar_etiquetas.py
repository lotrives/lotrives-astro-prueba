#!/usr/bin/env python3
import os, re

DRY_RUN = False

BASE_DIR = "/Users/josemanuelgrau/Documents/lotrives-astro-prueba"
CONTENT_DIRS = ["src/content/blog", "src/content/notes", "src/content/pages"]

MERGES = {
    "Benedicto XVI":           "Joseph Ratzinger",
    "Economía y cristianismo": "Economía",
    "Economía y mercado":      "Economía",
    "Iglesia católica":        "Iglesia",
    "Tomás de Aquino":         "Santo Tomás de Aquino",
    "Javier Miley":            "Javier Milei",
}

def process_tags(tags):
    seen = []
    for tag in tags:
        canonical = MERGES.get(tag, tag)
        if canonical not in seen:
            seen.append(canonical)
    return seen

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.match(r"^(---\n)(.*?)(\n---\n)(.*)", content, re.DOTALL)
    if not m: return None
    fm = m.group(2)
    tm = re.search(r"^(tags:\s*)(\[.*?\])", fm, re.MULTILINE)
    if not tm: return None
    old_tags = re.findall(r'"([^"]*)"', tm.group(2))
    if not old_tags: return None
    new_tags = process_tags(old_tags)
    if new_tags == old_tags: return None
    new_tags_str = "[" + ", ".join(f'"{t}"' for t in new_tags) + "]"
    new_fm = fm[:tm.start(2)] + new_tags_str + fm[tm.end(2):]
    new_content = m.group(1) + new_fm + m.group(3) + m.group(4)
    if not DRY_RUN:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
    return old_tags, new_tags

def main():
    mode = "DRY RUN" if DRY_RUN else "EJECUCIÓN REAL"
    print(f"\n{'='*50}\n  [{mode}]\n{'='*50}\n")
    changed = 0
    for d in CONTENT_DIRS:
        full_dir = os.path.join(BASE_DIR, d)
        if not os.path.exists(full_dir): continue
        for fname in sorted(os.listdir(full_dir)):
            if not fname.endswith(".md"): continue
            result = process_file(os.path.join(full_dir, fname))
            if result:
                old_tags, new_tags = result
                print(f"  {fname}")
                for t in old_tags:
                    if t not in new_tags:
                        print(f"    - {t!r} → {MERGES[t]!r}")
                changed += 1
    print(f"\n{'='*50}\n  Archivos afectados: {changed}\n{'='*50}\n")

if __name__ == "__main__":
    main()
