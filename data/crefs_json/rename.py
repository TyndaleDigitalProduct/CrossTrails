"""
Copy and rename the .json files in `verified-results` so the filename is only 
the book name. The copied files will be in the same directory as this script.

Example: `verified-results/40-Matt_verified_results.json` becomes `Matt.json`.
"""

import os

SOURCE_DIR = os.path.join(os.path.dirname(__file__), 'verified-results')
DEST_DIR = os.path.dirname(__file__)

for filename in os.listdir(SOURCE_DIR):
    if filename.endswith('_verified_results.json'):
        book_name = filename.split('-')[1].replace('_verified_results.json', '')
        new_filename = f"{book_name}.json"
        src = os.path.join(SOURCE_DIR, filename)
        dst = os.path.join(DEST_DIR, new_filename)
        print(f"Copying {src} to {dst}")
        with open(src, 'r') as fsrc, open(dst, 'w') as fdst:
            fdst.write(fsrc.read())
