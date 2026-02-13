import { tool } from '@opencode-ai/plugin'

const section = tool.schema.object({
  title: tool.schema
    .string()
    .describe('Title of the section (eg: "Core", "TUI")'),
  items: tool.schema
    .array(tool.schema.string())
    .describe('List of release items in this section'),
})

const release = tool.schema.object({
  title: tool.schema.string().describe('Title of the release (eg: v1.2.3)'),
  url: tool.schema
    .url()
    .describe(
      'URL to the release (eg: https://github.com/anomalyco/opencode/releases/tag/v1.2.3)',
    ),
  sections: tool.schema
    .array(section)
    .describe('List of sections in this release'),
})

type Release = (typeof release)['_output']

export default tool({
  description: 'Send a message to a Slack channel using a webhook URL.',
  args: {
    releases: tool.schema
      .array(release)
      .describe('List of releases to include in the message'),
  },
  async execute(args, context) {
    const webhookUrl = Bun.env.SLACK_WEBHOOK_URL
    return postDigest(args.releases, context.sessionID, webhookUrl)
  },
})

// --

export async function postDigest(
  releases: Release[],
  sessionID: string,
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
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'OpenCode Releases',
          },
        },
        ...releaseBlocks,
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Session: \`${sessionID}\``,
            },
          ],
        },
      ],
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
    const itemLines = section.items.map((item) => `- ${item}`).join('\n')
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${section.title}*\n${itemLines}`,
        },
      },
    ]
  })

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${release.url}|${release.title}>*`,
      },
    } as const,
    ...sectionBlocks,
    {
      type: 'divider',
    } as const,
  ]
}
