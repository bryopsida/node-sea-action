const core = require('@actions/core')
const { mkdir, cp, readFile } = require('node:fs/promises')
const { resolve, join } = require('node:path')
const { platform } = require('node:os')
const { execSync } = require('node:child_process')
const { inject } = require('postject')
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  const seaConfigPath = core.getInput('sea-config-path')
  const workingDir = core.getInput('working-dir')
  const outputPath = core.getInput('output-dir')
  const executableName = core.getInput('executable-name')

  const os = platform()
  const buildFolder = resolve(join(process.cwd(), outputPath))
  await mkdir(buildFolder, {
    recursive: true
  })

  const seaJsonPath = resolve(join(workingDir, seaConfigPath))
  execSync(`node --experimental-sea-config ${seaJsonPath}`)

  const pathToNode = resolve(process.argv[0])
  let nodeDest = join(buildFolder, executableName)

  if (os === 'win32' && !executableName.endsWith('.exe')) {
    nodeDest += '.exe'
  }

  await cp(pathToNode, nodeDest)

  // remove existing code signature on node binary
  if (os === 'win32') {
    execSync(`signtool remove /s ${nodeDest}`)
  } else if (os === 'darwin') {
    execSync(`codesign --remove-signature ${nodeDest}`)
  }
  const seaConfigContents = await readFile(seaJsonPath, {
    encoding: 'utf8'
  })
  const seaConfig = JSON.Parse(seaConfigContents)

  const blobPath = seaConfig.output

  const opts = {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
  }
  if (os === 'darwin') {
    opts.machoSegmentName = 'NODE_SEA'
  }
  await inject(nodeDest, 'NODE_SEA_BLOB', blobPath, opts)
}

module.exports = {
  run
}
