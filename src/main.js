const core = require('@actions/core')
const { mkdir, cp, readFile, readdir } = require('node:fs/promises')
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
  const inputNodePath = core.getInput('node-path')
  const pathToNode =
    inputNodePath !== '' ? resolve(inputNodePath) : resolve(process.argv[0])

  core.info(`Runtime Node version is: ${process.version}`)
  core.info(`Node path is: ${pathToNode}`)

  const os = platform()
  core.info(`OS Platform is: ${os}`)
  const buildFolder = resolve(join(process.cwd(), outputPath))
  await mkdir(buildFolder, {
    recursive: true
  })

  const seaJsonPath = resolve(join(workingDir, seaConfigPath))
  execSync(`${pathToNode} --experimental-sea-config ${seaJsonPath}`)

  let nodeDest = join(buildFolder, executableName)

  if (os === 'win32' && !executableName.endsWith('.exe')) {
    nodeDest += '.exe'
  }

  await cp(pathToNode, nodeDest)

  // remove existing code signature on node binary
  if (os === 'win32') {
    const sdkDir = join(
      process.env['ProgramFiles(x86)'],
      'Windows Kits',
      '10',
      'bin'
    )

    const sdkVersions = (await readdir(sdkDir)).filter(f =>
      f.startsWith('10.0.')
    )

    if (!sdkVersions.length)
      throw new Error(
        `No Windows 10 SDK version starting with 10.0. found under '${sdkDir}'`
      )

    // Get latest version
    const sdkVersion = sdkVersions[sdkVersions.length - 1]

    const signtoolExecutable = join(sdkDir, sdkVersion, 'x86', 'signtool.exe')

    execSync(`"${signtoolExecutable}" remove /s ${nodeDest}`)
  } else if (os === 'darwin') {
    execSync(`codesign --remove-signature ${nodeDest}`)
  }
  const seaConfigContents = await readFile(seaJsonPath, {
    encoding: 'utf8'
  })
  const seaConfig = JSON.parse(seaConfigContents)

  const blobPath = seaConfig.output

  const opts = {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
  }
  if (os === 'darwin') {
    opts.machoSegmentName = 'NODE_SEA'
  }
  const resourceBlob = await readFile(blobPath)
  await inject(nodeDest, 'NODE_SEA_BLOB', resourceBlob, opts)
}

module.exports = {
  run
}
