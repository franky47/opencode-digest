import type { Release } from './defs'

export async function postDigest(
  releases: Release[],
  webhookUrl?: string,
): Promise<string> {
  // If webhook not configured, log to stdout
  if (!webhookUrl) {
    console.log('=== SLACK_WEBHOOK_URL not configured ===')
    console.log('Would send to Slack:')
    console.log(releases)
    return 'SLACK_WEBHOOK_URL not configured, message logged to console instead.'
  }

  const releaseBlocks = releases.flatMap(renderRelease)

  // Post to Slack
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: releaseBlocks,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Slack API error: ${response.status} ${errorText}`)
  }

  return '✅ Digest posted to Slack successfully'
}

function renderRelease(release: Release) {
  const sectionBlocks = release.sections.flatMap((section) => {
    const itemLines = section.items.join('\n')
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: section.title ? `*${section.title}*\n${itemLines}` : itemLines,
        },
      },
    ]
  })
  const releaseUrl = `https://github.com/anomalyco/opencode/releases/tag/${release.name}`

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${releaseUrl}|${release.name}>*`,
      },
    } as const,
    ...sectionBlocks,
    {
      type: 'divider',
    } as const,
  ]
}
