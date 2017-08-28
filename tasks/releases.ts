import got = require('got')

interface GitRelease {
  tag_name: string,
  assets: Array<{ name: string }>
}

interface NodeRelease {
  version: string
}

type NodePlatform = 'windows' | 'mac' | 'alpine' | 'linux'
type NodeArch = 'x86' | 'x64'

const platforms: NodePlatform[] = ['windows', 'mac', 'alpine', 'linux'],
  architectures: NodeArch[] = ['x86', 'x64']

export interface NexeRelease {
  version: string,
  platform: NodePlatform,
  arch: NodeArch
}

async function getJson<T> (url) {
  return JSON.parse((await got(url)).body) as T
}

function isLessThanNode4 (version: string) {
  return +version.split('.')[0].replace('v', '') < 4
}

export async function getUnBuiltReleases () {
  const nodeReleases = (await getJson<NodeRelease[]>('https://nodejs.org/download/release/index.json'))
  const latestGitRelease = await getJson<GitRelease>('https://api.github.com/repos/nexe/nexe/releases/latest')
  const existingVersions = latestGitRelease.assets.map(x => {
    const [platform, version, arch] = x.name.split('-')
    return { arch, version, platform } as NexeRelease
  })

  return nodeReleases.reduce((versions, { version }) => {
    version = version.slice(1)
    if (isLessThanNode4(version)) {
      return versions
    }
    for (const platform of platforms) {
      if (platform === 'mac') {
        versions.push({ platform, arch: 'x64', version })
      } else {
        const builds = architectures.map(arch => { return { version, platform, arch }})
        versions.push(...builds)
      }
    }
    return versions
  }, [] as NexeRelease[])
  .filter(x => {
    return !existingVersions
      .some(y => y.arch === x.arch
        && y.platform === x.platform
        && y.version === x.version
      )
  })
}
