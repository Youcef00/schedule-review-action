# schedule-review-action

This action sends a Google Chat message to the specified space notified the specified user of his pending reviews

## Inputs

### `webhooks`

**Required** A list of Google chat webhooks to the users, the format must be the following:

`git_username:webhook_URL git_username2:webhook_URL2`

### `token`

**Required** A GitHub token for the GitHub API. 
*Note*: It is recommended to the use the GitHub Action's token and enabling read/write access in the repository settings under `Settings > Actions > General > Workflow permissions`  

## Example usage

```yaml
on:
  pull_request:
    types: [ review_requested ]

jobs:
  scheduled-PR-notification:
    runs-on: ubuntu-latest
    steps:
      - name: CR list publication
        id: cr_list
        uses: Youcef00/schedule-review-action@v1.0
        with:
          webhooks: ${{ format('{0} {1}', secrets.WEBHOOK_GITBOT, secrets.WEBHOOK_PLATCHOON) }}
          token: ${{ secrets.GITHUB_TOKEN }}
```