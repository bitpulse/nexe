import { compile } from '../'
import { getUnBuiltReleases } from './releases'
import * as ci from './ci'

const env = process.env,
  branchName = env.CIRCLE_BRANCH || env.APPVEYOR_REPO_BRANCH,
  isScheduled = Boolean(env.APPVEYOR_SCHEDULED_BUILD),
  isLinux = Boolean(env.TRAVIS),
  isWindows = Boolean(env.APPVEYOR),
  isMac = Boolean(env.CIRCLECI),
  isPullRequest = Boolean(env.CIRCLE_PR_NUMBER) || Boolean(env.APPVEYOR_PULL_REQUEST_NUMBER)

async function build () {
  if (isScheduled) {
    const releases = await getUnBuiltReleases()

    if (!releases.length) {
      return
    }

    const windowsBuild = releases.find(x => x.platform === 'windows')
    const macBuild = releases.find(x => x.platform === 'mac')
    const linuxOrAlpine = releases.find(x => x.platform === 'linux' || x.platform === 'alpine')

    if (linuxOrAlpine) {
      await ci.triggerDockerBuild(linuxOrAlpine)
    }

    if (macBuild) {
      await ci.triggerMacBuild(macBuild)
    }

    if (windowsBuild) {
      await ci.triggerWindowsBuild(windowsBuild)
    }
  }

  if (env.NEXE_VERSION) {
    const [platform, arch, version] = env.NEXE_VERSION.split('-')
    console.log('building ', env.NEXE_VERSION)
  }
}

build().catch(x => {
  console.error(x)
  process.exit(1)
})
