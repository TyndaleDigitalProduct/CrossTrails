"""
Write the categories found in the cross-reference data to categories.txt.
"""

import os
from glob import glob
import json
from typing import List, Dict, Any, Set

def list_categories(data: Dict[str, Any]) -> List[str]:
    categories: Set[str] = set()
    for item in data.get("items", []):
        primary = item.get("primary_category")
        secondary = item.get("secondary_category")
        if primary:
            categories.add(primary)
        if secondary:
            categories.add(secondary)
    return list(categories)

if __name__ == "__main__":
    categories: Set[str] = set()
    files = glob(os.path.join(os.path.dirname(__file__), '*.json'))
    for data_file_path in files:
        print(f"Processing {data_file_path}...")
        with open(data_file_path, 'r', encoding='utf-8') as f:
            data: Dict[str, Any] = json.load(f)
            # List categories
            categories.update(list_categories(data))

    # Write categories to categories.txt
    output_file_path = os.path.join(os.path.dirname(__file__), 'categories.txt')
    with open(output_file_path, 'w', encoding='utf-8') as f:
        for category in sorted(categories):
            f.write(f"{category}\n")
