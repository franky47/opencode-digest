import { $ } from 'bun'

export type RawReleaseNotes = {
  name: string
  body: string
}

export async function fetchReleases(
  now = new Date(),
): Promise<RawReleaseNotes[]> {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const result =
    await $`gh release list --repo anomalyco/opencode --json name,publishedAt`.json()
  if (!Array.isArray(result)) {
    throw new Error(
      'Unexpected result from gh release list: ' + JSON.stringify(result),
    )
  }
  const recentReleases = result.filter((release) => {
    const publishedAt = new Date(release.publishedAt)
    return publishedAt > oneDayAgo
  })
  return Promise.all(
    recentReleases.map(async (release) => {
      const body = await fetchRelease(release.name)
      return {
        name: release.name,
        body,
      }
    }),
  )
}

async function fetchRelease(name: string) {
  const result =
    await $`gh release view ${name} --repo anomalyco/opencode --json body`.json()
  if (typeof result.body === 'string') {
    return result.body
  }
  return ''
}
