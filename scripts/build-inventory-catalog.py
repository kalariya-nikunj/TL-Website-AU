"""Convert the Tinkerers Lab machinery workbook into the app's inventory seed catalog.

Run with: python scripts/build-inventory-catalog.py <workbook.xlsx>
The generated JSON is bundled by the website; this script never writes to Firebase.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl


def clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).replace("\ufffd", "-").strip()


def num(value):
    try:
        result = float(value)
        return max(0, int(result))
    except (TypeError, ValueError):
        return None


def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "inventory-item"


def row_data(sheet, row, col):
    return clean(sheet.cell(row=row, column=col).value)


def make_item(sheet_name, row, sr, name, description, model, url, total, available, borrowable=True, review=False, state=""):
    name = clean(name)
    if not name:
        return None
    key = slug(sheet_name) + "-" + slug(name) + ("-" + slug(model) if model else "")
    description = " · ".join(part for part in [clean(description), clean(model)] if part)
    return {
        "itemId": key[:120], "name": name, "category": sheet_name,
        "description": description or "Inventory item listed in the Tinkerers Lab inventory workbook.",
        "sourceSheet": sheet_name, "sourceRow": row, "sourceReference": clean(sr),
        "detailsUrl": clean(url) if clean(url).startswith("https://") else "",
        "totalQuantity": max(0, total or 0), "availableQuantity": max(0, available or 0),
        "borrowable": bool(borrowable), "stockNeedsReview": bool(review),
        "sourceStatus": clean(state), "imageUrl": "",
    }


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/build-inventory-catalog.py <workbook.xlsx>")
    workbook_path = Path(sys.argv[1])
    wb = openpyxl.load_workbook(workbook_path, data_only=True, read_only=False)
    items = []

    # Power tools: total QTY minus explicit issued units. Out-Lab items are not
    # available to borrow until the lab confirms their return.
    ws = wb["Power tools"]
    for row in range(4, ws.max_row + 1):
        name, total, availability, issued = row_data(ws, row, 3), num(ws.cell(row, 4).value), row_data(ws, row, 11), row_data(ws, row, 12)
        if not name or num(ws.cell(row, 2).value) is None:
            continue
        issued_match = re.search(r"(\d+)", issued)
        available = 0 if availability.lower() == "out-lab" else max(0, (total or 0) - (int(issued_match.group(1)) if issued_match else 0))
        items.append(make_item(ws.title, row, row_data(ws, row, 2), name, row_data(ws, row, 5), row_data(ws, row, 7), row_data(ws, row, 8), total, available, review=total is None, state=availability))

    # Consumables: rows without stock counts remain non-borrowable until the
    # initial physical count is entered by an authorized inventory admin.
    ws = wb["Power tools Consumables"]
    for row in range(5, ws.max_row + 1):
        name = row_data(ws, row, 5)
        if name and name.lower() not in {"consumable", "machine name"}:
            items.append(make_item(ws.title, row, row_data(ws, row, 2), name,
                "For " + row_data(ws, row, 3) + (" · " + row_data(ws, row, 6) if row_data(ws, row, 6) else ""),
                row_data(ws, row, 4) or row_data(ws, row, 7), row_data(ws, row, 8), 0, 0, review=True, state="Stock count required"))

    # Fixed machinery is listed for discovery, but cannot be checked out.
    ws = wb["Macheneries"]
    for row in range(4, ws.max_row + 1):
        name = row_data(ws, row, 3)
        if name and num(ws.cell(row, 2).value) is not None:
            state = row_data(ws, row, 10)
            qty = num(ws.cell(row, 8).value) or 0
            items.append(make_item(ws.title, row, row_data(ws, row, 2), name,
                row_data(ws, row, 9), " ".join(x for x in [row_data(ws, row, 4), row_data(ws, row, 5), row_data(ws, row, 7)] if x),
                row_data(ws, row, 6), qty, 0, borrowable=False, state=state or "Lab use only"))

    # Electrical and electronics: QTY-In is the physically available count.
    ws = wb["Electrical and Electronics"]
    for row in range(5, ws.max_row + 1):
        name = row_data(ws, row, 3)
        if name and num(ws.cell(row, 2).value) is not None:
            out, inside = num(ws.cell(row, 4).value), num(ws.cell(row, 5).value)
            items.append(make_item(ws.title, row, row_data(ws, row, 2), name, row_data(ws, row, 7), row_data(ws, row, 6), row_data(ws, row, 9), (out or 0) + (inside or 0), inside or 0, review=out is None and inside is None, state=row_data(ws, row, 11)))

    # Components list has a single Quantity column.
    ws = wb["Electrical and Electronics Comp"]
    for row in range(2, ws.max_row + 1):
        name, qty = row_data(ws, row, 2), num(ws.cell(row, 3).value)
        if name:
            items.append(make_item(ws.title, row, row_data(ws, row, 1), name, row_data(ws, row, 4) + (" · " + row_data(ws, row, 5) if row_data(ws, row, 5) else ""), "", "", qty, qty, review=qty is None, state="In stock" if qty else "Out of stock"))

    # For tools and measurement equipment the workbook tracks units out/in.
    for sheet_name, name_col, out_col, in_col, model_col, url_col, accessory_col in [
        ("Hand tool 2.0", 3, 4, 5, 8, 9, 6),
        ("Measurement Tools", 3, 4, 5, 8, 9, 6),
    ]:
        ws = wb[sheet_name]
        start_row = 7 if sheet_name == "Hand tool 2.0" else 3
        for row in range(start_row, ws.max_row + 1):
            name = row_data(ws, row, name_col)
            if not name or num(ws.cell(row, 2).value) is None:
                continue
            out, inside = num(ws.cell(row, out_col).value), num(ws.cell(row, in_col).value)
            condition = row_data(ws, row, accessory_col)
            condition_needs_repair = any(word in condition.lower() for word in ("damaged", "reparable"))
            available = 0 if condition_needs_repair else inside or 0
            items.append(make_item(sheet_name, row, row_data(ws, row, 2), name, condition, row_data(ws, row, model_col), row_data(ws, row, url_col), (out or 0) + (inside or 0), available, review=out is None and inside is None, state=row_data(ws, row, 10)))

    # Safety quantities use mixed text formats in the workbook. Do not guess:
    # mark ambiguous rows for physical stock confirmation before checkout.
    ws = wb["Safety Equipment"]
    for row in range(3, ws.max_row + 1):
        name = row_data(ws, row, 3)
        if not name or num(ws.cell(row, 2).value) is None:
            continue
        out, inside = num(ws.cell(row, 4).value), num(ws.cell(row, 5).value)
        ambiguous = (ws.cell(row, 4).value not in (None, "") and out is None) or (ws.cell(row, 5).value not in (None, "") and inside is None)
        items.append(make_item(ws.title, row, row_data(ws, row, 2), name, row_data(ws, row, 9), row_data(ws, row, 7), row_data(ws, row, 8), (out or 0) + (inside or 0), inside or 0, review=ambiguous or (out is None and inside is None), state="Stock count required" if ambiguous else ""))

    # Resolve accidental slug collisions without losing any source rows.
    seen = {}
    for item in items:
        seen[item["itemId"]] = seen.get(item["itemId"], 0) + 1
        if seen[item["itemId"]] > 1:
            item["itemId"] += "-" + str(item["sourceRow"])
    out_path = Path(__file__).with_name("inventory-catalog.json")
    out_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(items)} inventory rows to {out_path}")
    print("Borrowable initially:", sum(item["borrowable"] for item in items))
    print("Stock confirmation needed:", sum(item["stockNeedsReview"] for item in items))


if __name__ == "__main__":
    main()
