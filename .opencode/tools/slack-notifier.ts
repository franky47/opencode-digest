import { tool } from '@opencode-ai/plugin'

export default tool({
  description: 'Send a message to a Slack channel using a webhook URL.',
  args: {
    markdown: tool.schema
      .string()
      .describe('Markdown-formatted message to send to Slack'),
  },
  async execute(args) {
    const webhookUrl = Bun.env.SLACK_WEBHOOK_URL
    return postDigest(args.markdown, webhookUrl)
  },
})

// --

export async function postDigest(
  digest: string,
  webhookUrl?: string,
): Promise<string> {
  // If webhook not configured, log to stdout
  if (!webhookUrl) {
    console.log('=== SLACK_WEBHOOK_URL not configured ===')
    console.log('Would send to Slack:')
    console.log(digest)
    return 'SLACK_WEBHOOK_URL not configured, message logged to console instead.'
  }

  // Post to Slack
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: digest,
      mrkdwn: true, // Enable markdown formatting
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Slack API error: ${response.status} ${errorText}`)
  }

  return '✅ Digest posted to Slack successfully'
}
