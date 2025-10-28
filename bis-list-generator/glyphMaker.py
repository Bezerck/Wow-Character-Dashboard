
import re
import json
import os

def parse_proto_enum(proto_content, enum_name):
    enum_block = re.search(r'enum\s+' + re.escape(enum_name) + r'\s*{([^}]*)}', proto_content, re.DOTALL)
    if not enum_block:
        return {}
    entries = {}
    for line in enum_block.group(1).splitlines():
        m = re.match(r'\s*(GlyphOf\w+)\s*=\s*(\d+);', line)
        if m:
            entries[m.group(1)] = int(m.group(2))
    return entries

def extract_glyphs(ts_content, class_name):
    def parse_block(block):
        glyphs = {}
        glyph_regex = re.compile(
            rf'\[{class_name}(?:Major|Minor)Glyph\.(GlyphOf\w+)\]:\s*{{([^}}]*)}}', re.DOTALL
        )
        for match in glyph_regex.finditer(block):
            glyph_name = match.group(1)
            props = match.group(2)
            name = re.search(r'name:\s*"([^"]+)"', props)
            description = re.search(r'description:\s*"([^"]+)"', props)
            iconurl = re.search(r'iconUrl:\s*"([^"]+)"', props)
            glyphs[glyph_name] = {
                "name": name.group(1) if name else "",
                "description": description.group(1) if description else "",
                "iconUrl": iconurl.group(1) if iconurl else ""
            }
        return glyphs

    major_block = re.search(r'majorGlyphs:\s*{([^}]*)},', ts_content, re.DOTALL)
    minor_block = re.search(r'minorGlyphs:\s*{([^}]*)}', ts_content, re.DOTALL)
    return {
        "majorGlyphs": parse_block(major_block.group(1)) if major_block else {},
        "minorGlyphs": parse_block(minor_block.group(1)) if minor_block else {},
    }

def get_glyph_info(ts_content, glyph_name, class_name):
    pattern = re.compile(
        rf'\[{class_name}(?:Major|Minor)Glyph\.{glyph_name}\]:\s*{{([^}}]*)}}',
        re.DOTALL
    )
    match = pattern.search(ts_content)
    if not match:
        return None
    props = match.group(1)
    name = re.search(r'name:\s*"([^"]+)"', props)
    description = re.search(r'description:\s*"([^"]+)"', props)
    iconurl = re.search(r'iconUrl:\s*"([^"]+)"', props)
    return {
        "name": name.group(1) if name else "",
        "description": description.group(1) if description else "",
        "iconUrl": iconurl.group(1) if iconurl else ""
    }

def match_glyphs(ts_content, glyph_dict, id_dict, class_name):
    result = []
    for name, id_val in id_dict.items():
        info = get_glyph_info(ts_content, name, class_name)
        if info:
            result.append({
                "enumName": name,
                "id": id_val,
                "name": info.get("name", ""),
                "description": info.get("description", ""),
                "iconUrl": info.get("iconUrl", "")
            })
        else:
            print(f"Warning: No matching glyph found for {class_name} {name} with ID {id_val}")
            result.append({
                "enumName": name,
                "id": id_val,
                "name": "",
                "description": "",
                "iconUrl": ""
            })
    return result

classes = [
    "warrior", "death_knight", "druid", "hunter", "mage", "monk", "paladin", "priest", "rogue", "shaman", "warlock"
]

output = {}
for class_name in classes:
    proto_file = f"{class_name}.proto"
    ts_file = f"{class_name}.ts"
    if not os.path.exists(proto_file) or not os.path.exists(ts_file):
        print(f"Warning: Missing files for {class_name}")
        continue
    with open(proto_file, "r", encoding="utf-8") as f:
        proto_content = f.read()
    with open(ts_file, "r", encoding="utf-8") as f:
        ts_content = f.read()

    major_enum = f"{class_name.title().replace('_', '')}MajorGlyph"
    minor_enum = f"{class_name.title().replace('_', '')}MinorGlyph"
    major_ids = parse_proto_enum(proto_content, major_enum)
    minor_ids = parse_proto_enum(proto_content, minor_enum)
    glyphs = extract_glyphs(ts_content, class_name.title().replace('_', ''))

    output[class_name] = {
        "majorGlyphs": match_glyphs(ts_content, glyphs["majorGlyphs"], major_ids, class_name.title().replace('_', '')),
        "minorGlyphs": match_glyphs(ts_content, glyphs["minorGlyphs"], minor_ids, class_name.title().replace('_', ''))
    }

print(json.dumps(output, indent=2))
