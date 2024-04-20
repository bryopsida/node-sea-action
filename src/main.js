const core = require('@actions/core')
const { mkdir, stat, rm, cp, writeFile, readFile } = require('node:fs/promises')
const { resolve, join } = require('node:path')
const { platform } = require('node:os')
const { execSync } = require('node:child_process')
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  const seaConfigPath = core.getInput('sea-config-path')
  const workingDir = core.getInput('working-dir')
  const outputPath = core.getInput('output-dir')
  const executableName = core.getInput('executable-name')
  const appPath = core.getInput('path-to-app')



  const os = platform()
  const buildFolder = resolve(join(process.cwd(), outputPath))
  await mkdir(resolve(join(process.cwd(), buildFolder)))

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
  const seaConfig = json.Parse(seaConfigContents)

  const blobPath = seaConfig.output

  // TODO: switch to postject api call
  // if (os === 'darwin') {
  //   execSync(`npx postject ${nodeDest} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`)
  // } else {
  //   execSync(`npx postject ${nodeDest} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`)
  // }
}

module.exports = {
  run
}
