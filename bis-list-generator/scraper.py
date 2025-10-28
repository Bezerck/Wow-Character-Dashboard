import requests
from bs4 import BeautifulSoup
import json

# List of specs and their Wowhead BiS guide URLs
SPEC_URLS = {
    "Blood Death Knight": "https://www.wowhead.com/mop-classic/guide/classes/death-knight/blood/tank-best-gear-bis-pve",
    "Frost Death Knight": "https://www.wowhead.com/mop-classic/guide/classes/death-knight/frost/dps-best-gear-bis-pve",
    "Unholy Death Knight": "https://www.wowhead.com/mop-classic/guide/classes/death-knight/unholy/dps-best-gear-bis-pve",
    "Balance Druid": "https://www.wowhead.com/mop-classic/guide/classes/druid/balance/dps-best-gear-bis-pve",
    "Feral Druid": "https://www.wowhead.com/mop-classic/guide/classes/druid/feral/dps-best-gear-bis-pve",
    "Guardian Druid": "https://www.wowhead.com/mop-classic/guide/classes/druid/guardian/tank-best-gear-bis-pve",
    "Restoration Druid": "https://www.wowhead.com/mop-classic/guide/classes/druid/restoration/healer-best-gear-bis-pve",
    "Beast Mastery Hunter": "https://www.wowhead.com/mop-classic/guide/classes/hunter/beast-mastery/dps-best-gear-bis-pve",
    "Marksmanship Hunter": "https://www.wowhead.com/mop-classic/guide/classes/hunter/marksmanship/dps-best-gear-bis-pve",
    "Survival Hunter": "https://www.wowhead.com/mop-classic/guide/classes/hunter/survival/dps-best-gear-bis-pve",
    "Arcane Mage": "https://www.wowhead.com/mop-classic/guide/classes/mage/arcane/dps-best-gear-bis-pve",
    "Fire Mage": "https://www.wowhead.com/mop-classic/guide/classes/mage/fire/dps-best-gear-bis-pve",
    "Frost Mage": "https://www.wowhead.com/mop-classic/guide/classes/mage/frost/dps-best-gear-bis-pve",
    "Brewmaster Monk": "https://www.wowhead.com/mop-classic/guide/classes/monk/brewmaster/tank-best-gear-bis-pve",
    "Mistweaver Monk": "https://www.wowhead.com/mop-classic/guide/classes/monk/mistweaver/healer-best-gear-bis-pve",
    "Windwalker Monk": "https://www.wowhead.com/mop-classic/guide/classes/monk/windwalker/dps-best-gear-bis-pve",
    "Holy Paladin": "https://www.wowhead.com/mop-classic/guide/classes/paladin/holy/healer-best-gear-bis-pve",
    "Protection Paladin": "https://www.wowhead.com/mop-classic/guide/classes/paladin/protection/tank-best-gear-bis-pve",
    "Retribution Paladin": "https://www.wowhead.com/mop-classic/guide/classes/paladin/retribution/dps-best-gear-bis-pve",
    "Discipline Priest": "https://www.wowhead.com/mop-classic/guide/classes/priest/discipline/healer-best-gear-bis-pve",
    "Holy Priest": "https://www.wowhead.com/mop-classic/guide/classes/priest/holy/healer-best-gear-bis-pve",
    "Shadow Priest": "https://www.wowhead.com/mop-classic/guide/classes/priest/shadow/dps-best-gear-bis-pve",
    "Assassination Rogue": "https://www.wowhead.com/mop-classic/guide/classes/rogue/assassination/dps-best-gear-bis-pve",
    "Combat Rogue": "https://www.wowhead.com/mop-classic/guide/classes/rogue/combat/dps-best-gear-bis-pve",
    "Subtlety Rogue": "https://www.wowhead.com/mop-classic/guide/classes/rogue/subtlety/dps-best-gear-bis-pve",
    "Elemental Shaman": "https://www.wowhead.com/mop-classic/guide/classes/shaman/elemental/dps-best-gear-bis-pve",
    "Enhancement Shaman": "https://www.wowhead.com/mop-classic/guide/classes/shaman/enhancement/dps-best-gear-bis-pve",
    "Restoration Shaman": "https://www.wowhead.com/mop-classic/guide/classes/shaman/restoration/healer-best-gear-bis-pve",
    "Affliction Warlock": "https://www.wowhead.com/mop-classic/guide/classes/warlock/affliction/dps-best-gear-bis-pve",
    "Demonology Warlock": "https://www.wowhead.com/mop-classic/guide/classes/warlock/demonology/dps-best-gear-bis-pve",
    "Destruction Warlock": "https://www.wowhead.com/mop-classic/guide/classes/warlock/destruction/dps-best-gear-bis-pve",
    "Arms Warrior": "https://www.wowhead.com/mop-classic/guide/classes/warrior/arms/dps-best-gear-bis-pve",
    "Fury Warrior": "https://www.wowhead.com/mop-classic/guide/classes/warrior/fury/dps-best-gear-bis-pve",
    "Protection Warrior": "https://www.wowhead.com/mop-classic/guide/classes/warrior/protection/tank-best-gear-bis-pve",
}

def normalize_source(source):
    # Add space before parenthesis if missing
    source = source.replace(")(", ") (")
    # Replace concatenated boss/raid names with comma separation
    import re
    # Add comma between boss/raid pairs like 'Tsulong(Terrace of Endless Spring)Lei Shi(Terrace of Endless Spring)'
    source = re.sub(r'(\w+\([^)]*\))(?=\w+\()', r'\1, ', source)
    # Standardize currency/vendor sources
    source = source.replace('InscriptionBoE', 'Inscription (BoE)')
    source = source.replace('Valor Points', ' Valor Points')
    source = re.sub(r'(\d+)(Valor Points)', r'\1 Valor Points', source)
    # Remove duplicate spaces
    source = re.sub(r'\s+', ' ', source).strip()
    return source

def fetch_bis_list(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    bis_items = []
    table = soup.find("table")
    if not table:
        return bis_items
    # Fixed slot order for parsing
    slot_order = [
        "Helm", "Neck", "Shoulders", "Cloak", "Chest", "Bracers", "Gloves", "Belt", "Legs", "Boots",
        "Ring", "Ring", "Trinket", "Trinket", "Mainhand", "Off-hand"
    ]
    rows = table.find_all("tr")[1:]  # Skip header
    for idx, row in enumerate(rows):
        if idx >= len(slot_order):
            break
        cols = row.find_all(["td", "th"])
        item = source = ""
        last_col_empty = len(cols) > 1 and cols[-1].get_text(strip=True) == ""
        # If there are 4 columns, use second and third as item and source
        if len(cols) == 4:
            item = cols[1].get_text(strip=True)
            source = cols[2].get_text(strip=True)
        # If slot name is present, use second and third columns
        elif len(cols) >= 3 and not last_col_empty:
            item = cols[1].get_text(strip=True)
            source = cols[2].get_text(strip=True)
        # If slot name is missing, use first as item and second as source
        elif len(cols) == 2 or (len(cols) >= 3 and last_col_empty):
            item = cols[0].get_text(strip=True)
            source = cols[1].get_text(strip=True)
        elif len(cols) == 1:
            item = cols[0].get_text(strip=True)
            source = ""
        slot = slot_order[idx]
        if item:
            bis_items.append({"slot": slot, "item": item, "source": normalize_source(source)})
    return bis_items

def main():
    bis_data = {}
    for spec, url in SPEC_URLS.items():
        print(f"Fetching BiS list for {spec}...")
        bis_data[spec] = fetch_bis_list(url)
    with open("bis_list.json", "w", encoding="utf-8") as f:
        json.dump(bis_data, f, indent=2, ensure_ascii=False)
    print("BiS lists saved to out.txt")

if __name__ == "__main__":
    main()