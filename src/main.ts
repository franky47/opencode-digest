import type { Release } from './defs'
import { fetchReleases, type RawReleaseNotes } from './fetch-releases'
import { filterSections, splitReleaseNotesSections } from './processor'
import { postDigest } from './slack-notifier'

async function main() {
  const releaseNotes = await fetchReleases()
  const digest = processReleaseNotes(releaseNotes)
  postDigest(digest, Bun.env.SLACK_WEBHOOK_URL)
}

export function processReleaseNotes(releases: RawReleaseNotes[]): Release[] {
  return releases.map((r) => ({
    name: r.name,
    sections: filterSections(splitReleaseNotesSections(r.body)),
  }))
}

main().catch((err) => {
  console.error('Error in main:', err)
  process.exit(1)
})
