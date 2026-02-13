---
name: releases-feed
description: Fetch GitHub releases for OpenCode.
---

You can access OpenCode releases using the `gh` CLI.
To get the bodies of all releases published in the last 24 hours, run the following command as-is (the whole thing):

```bash
gh release list --repo anomalyco/opencode --json name,publishedAt | \
  jq -r '.[] | select(.publishedAt > (now - 86400 | todateiso8601)) | .name' | \
  while read -r name; do
    echo "# $name"
    gh release view "$name" --repo anomalyco/opencode --json body -q .body
    echo "---"
  done
```
