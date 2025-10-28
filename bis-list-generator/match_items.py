import json

# Load items from db.json
with open('../db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    items = data.get('items', [])

# Build a mapping: name -> item with highest ilvl
name_to_best_item = {}
for item in items:
    name = item.get('name')
    # Find ilvl from scalingOptions (may be multiple, take max)
    ilvl = 0
    scaling = item.get('scalingOptions', {})
    if isinstance(scaling, dict):
        ilvl = max([v.get('ilvl', 0) for v in scaling.values() if isinstance(v, dict)], default=0)
    else:
        ilvl = item.get('ilvl', 0)
    item_id = item.get('id')
    if name is None or item_id is None:
        continue
    if name not in name_to_best_item or ilvl > name_to_best_item[name]['ilvl']:
        name_to_best_item[name] = {'id': item_id, 'ilvl': ilvl}

# Load bis_list.json
with open('bis_list.json', 'r', encoding='utf-8') as f:
    bis_list = json.load(f)

# For each spec, add item id to each item
bis_list_with_ids = {}
for spec, items in bis_list.items():
    bis_list_with_ids[spec] = []
    for entry in items:
        item_name = entry.get('item')
        item_id = name_to_best_item.get(item_name, {}).get('id')
        new_entry = dict(entry)
        new_entry['id'] = item_id if item_id is not None else 'NOT_FOUND'
        bis_list_with_ids[spec].append(new_entry)

# Save result
with open('bis_list_with_ids.json', 'w', encoding='utf-8') as f:
    json.dump(bis_list_with_ids, f, ensure_ascii=False, indent=2)

print('BIS list with item IDs saved to bis_list_with_ids.json')
