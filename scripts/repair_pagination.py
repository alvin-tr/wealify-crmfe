import re

file_path = r'C:\Users\TheHuman\Desktop\antigravity\CRM\crm-web\pages\customers.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The top half ends with:
#                 >
#                   {{ page }}
#                 </UButton>
# [newline]
#         <div class="overflow-x-auto pb-4">
top_half_end_pattern = re.compile(
    r'(\s*\{\{\s*page\s*\}\}\n\s*</UButton>\n)(?=\s*<div class="overflow-x-auto pb-4">)'
)

match_top = top_half_end_pattern.search(content)
if not match_top:
    print("Could not find top half end.")
    exit(1)

# The bottom half starts with:
#               <template v-else>
#                 <!-- First page -->
bottom_half_pattern = re.compile(
    r'(\s*<template v-else>\n\s*<!-- First page -->.*?\s*</template>\n\s*</template>\n)',
    re.DOTALL
)

match_bottom = bottom_half_pattern.search(content)
if not match_bottom:
    print("Could not find bottom half.")
    exit(1)

bottom_half_content = match_bottom.group(1)

# We need to extract the bottom_half_content EXCEPT the final `</template>\n</template>\n`.
# Let's inspect bottom_half_content
# It ends with:
#             </div>
#           </div>
#         </div>
#       </template> (the new one we added)
#       </template> (the orphaned one)

# Let's clean up the bottom half. The original pagination block ended at the `</div>` that closed `<!-- Pagination -->` div.
clean_bottom = bottom_half_content
# We should drop the last two `</template>` and just end with the closing `</div>`s.
# Let's find the `</div>` that aligns with `<div class="flex flex-col sm:flex-row ...">`
last_div_pattern = re.compile(r'(\s*</div>\n\s*</div>\n\s*</div>\n)\s*</template>\n\s*</template>\n')
clean_bottom = last_div_pattern.sub(r'\1', clean_bottom)

# Wait, before `<template v-else>`, there needs to be a `</template>` to close the `<template v-if="totalPages <= 7">`.
restored_bottom = "\n              </template>" + clean_bottom

# Now, we remove the bottom half from the content
content = content[:match_bottom.start()] + content[match_bottom.end():]

# And we insert the restored bottom half into the top half
content = content[:match_top.end()] + restored_bottom + content[match_top.end():]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully stitched pagination block together!")
