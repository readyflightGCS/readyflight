import { execSync } from 'child_process'
import { join } from 'path'

const platform = process.argv[2]
if (!platform || !['mac', 'win', 'linux', 'unpack'].includes(platform)) {
  console.error('Usage: bun run scripts/build.ts <mac|win|linux|unpack>')
  process.exit(1)
}

const version =
  process.env.APP_VERSION || execSync('git describe --tags --dirty').toString().trim()

console.log(`Building version: ${version}`)

const electronDir = join(import.meta.dir, '..', 'electron')

execSync('bun run build', { stdio: 'inherit', cwd: electronDir })
execSync('bun run rebuild:native', { stdio: 'inherit', cwd: electronDir })
execSync(
  `electron-builder --config electron-builder.yml --${platform} --config.extraMetadata.version="${version}"`,
  { stdio: 'inherit', cwd: electronDir }
)
