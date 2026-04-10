import re

file_path = r'C:\Users\TheHuman\Desktop\antigravity\CRM\crm-web\pages\customers.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract the pagination block
# We look for:
#       <!-- Pagination -->
#       <template #footer>
#         <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
#           ...
#       </template>
#     </UCard>
pagination_pattern = re.compile(
    r'(?P<indent>      )<!-- Pagination -->\n\s*<template #footer>\n(?P<inner>.*?)\n\s*</template>\n',
    re.DOTALL
)

match = pagination_pattern.search(content)
if not match:
    print("Could not find pagination block.")
    exit(1)

pagination_inner = match.group('inner')
indent = match.group('indent')

# Strip out the block from its current location
content = content[:match.start()] + content[match.end():]

# 2. Modify the block (Upgrade to USelectMenu, change border-t to border-b)
# Also change :options to :items, add value-key and label-key
pagination_inner = pagination_inner.replace('border-t border-gray-200 dark:border-gray-700', 'border-b border-gray-200 dark:border-gray-700')
pagination_inner = pagination_inner.replace('<USelect', '<USelectMenu value-key="value" label-key="label"')
pagination_inner = pagination_inner.replace(':options="itemsPerPageOptions"', ':items="itemsPerPageOptions"')

# Re-indent the inner block 
inner_lines = pagination_inner.split('\n')
new_inner = '\n'.join([line for line in inner_lines])

new_pagination_block = f"""
      <!-- Pagination (Moved to Top) -->
{new_inner}
"""

# 3. Find the Table injection point
#       <!-- Table -->
#     <div v-else class="overflow-x-auto pb-4">
table_pattern = re.compile(
    r'(?P<indent>      )<!-- Table -->\n\s*<div v-else class="overflow-x-auto pb-4">'
)

table_match = table_pattern.search(content)
if not table_match:
    print("Could not find Table injection point.")
    exit(1)

table_indent = table_match.group('indent')

# 4. Inject
# We change the `v-else` on the div to `<template v-else>` wrapping both.
replacement = f"""{table_indent}<!-- Table -->
      <template v-else>
{new_pagination_block}
        <div class="overflow-x-auto pb-4">"""

content = content[:table_match.start()] + replacement + content[table_match.end():]

# 5. We need to close the `<template v-else>` right after the table `</div>`
# Where does the table `</div>` end? Right before the old pagination block (which was right before </UCard>)
# Wait, look at the original file:
# 605:         </div>
# 606:       </div>
# 607: 
# 608:       <!-- Pagination --> (this was here, now empty)
# 609:     </UCard>
# We need to insert `</template>` before `</UCard>`.
# Since we stripped the pagination block, we can just replace the first `</UCard>` after the table with `      </template>\n    </UCard>`.

# Find the end of the UCard table block
ucard_end_pattern = re.compile(r'\n    </UCard>')
# We just need to replace the FIRST occurrence AFTER our injection point
after_injection = content[table_match.start():]
ucard_end_match = ucard_end_pattern.search(after_injection)
if not ucard_end_match:
    print("Could not find </UCard> closing tag.")
    exit(1)

content = content[:table_match.start() + ucard_end_match.start()] + '\n      </template>\n    </UCard>' + content[table_match.start() + ucard_end_match.end():]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved pagination to the top!")
