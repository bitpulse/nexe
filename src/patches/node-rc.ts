import { NexeCompiler } from '../compiler'

export default async function nodeRc(compiler: NexeCompiler, next: () => Promise<void>) {
  const options = compiler.options.rc
  if (!options) {
    return next()
  }

  const file = await compiler.readFileAsync('src/res/node.rc')

  Object.keys(options).forEach(key => {
    let value = options[key]
    const isVar = /^[A-Z_]+$/.test(value)
    value = isVar ? value : `"${value}"`
    file.contents.replace(new RegExp(`VALUE "${key}",*`), `VALUE "${key}", ${value}`)
  })

  return next()
}
