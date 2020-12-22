import Debug from 'debug'
import _ from 'lodash'
import path from 'path'
import send from 'send'
import ProjectCt, { Cfg } from '@packages/server-ct/src/project-ct'
import SpecsStore from '@packages/server-ct/src/specs-controller'

interface ServeOptions {
  config: Cfg
  project: ProjectCt
  specsStore: SpecsStore
}

const debug = Debug('cypress:server:runner-ct')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)

  return path.join(...paths)
}

export const getPathToDist = (...args) => {
  return dist(...args)
}

export const handle = (req, res) => {
  const pathToFile = getPathToDist(req.params[0])

  return send(req, pathToFile)
  .pipe(res)
}

export const serve = (req, res, options: ServeOptions) => {
  let { config } = options
  const { specsStore, project } = options

  const { browser } = project.getCurrentSpecAndBrowser()

  // TODO: move the component file watchers in here
  // and update them in memory when they change and serve
  // them straight to the HTML on load

  config = _
  .chain(config)
  .clone()
  .extend({
    browser,
    specs: specsStore.specFiles,
  })
  .value()

  // const webpackConfig = await resolveWebpackConfig(userWebpackConfig, testConfig)
  // const compiler = webpack(webpackConfig)

  // new webpackDevServer(compiler, { hot: true }).listen(3000)

  debug('serving runner index.html with config %o',
    _.pick(config, 'version', 'platform', 'arch', 'projectName'))

  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952
  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || getPathToDist('index.html')

  return res.render(runnerPath, {
    base64Config,
    projectName: config.projectName,
  })
}