#!/usr/bin/env python3
"""
Auto-convert MSSQL routes to MySQL syntax
"""

import re
import os
import glob

def convert_mssql_to_mysql(content):
    """Convert MSSQL syntax to MySQL"""
    
    # Replace imports
    content = re.sub(
        r"const\s+{\s*sql,\s*poolPromise\s*}\s*=\s*require\(['\"]\.\.\/\.\.\/db['\"]\)",
        "const pool = require('../../db')",
        content
    )
    
    # Remove await poolPromise
    content = re.sub(r'\s*const\s+pool\s*=\s*await\s+poolPromise;?\s*\n', '', content)
    
    # Convert simple SELECT queries
    # pool.request().input('id', sql.Int, value).query('SELECT...') → pool.query('SELECT...', [value])
    
    # This is complex - let's do specific patterns
    return content

def main():
    files = glob.glob('src/modules/*/routes.js') + glob.glob('src/modules/*/service.js')
    
    for filepath in files:
        if 'auth' in filepath or 'users' in filepath:
            print(f"⏭️  Skipping {filepath} (already converted)")
            continue
            
        print(f"📝 Converting {filepath}...")
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        converted = convert_mssql_to_mysql(content)
        
        with open(filepath, 'w') as f:
            f.write(converted)
        
        print(f"✅ Converted {filepath}")

if __name__ == '__main__':
    main()
