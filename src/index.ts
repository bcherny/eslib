import { blue, cyan, green, magenta } from 'cli-color'
import { valid, gte } from 'semver'
import { model } from './model'
import { warn, isNative, isCompatible } from './utils'

export let authors = model()
export let versions = model()

export function assign<T extends object, K extends keyof T>(
  type: T,
  fns: Record<K, T[K]>,
  author: string,
  version: string
) {

  for (let name in fns) {

    let fn = fns[name]

    // validate version
    if (!valid(version)) {
      warn(`Version string ${magenta(version)} for method ${green(name)} on type ${blue(type)} is invalid - please specify version as X.Y.Z (eg. ${magenta('1.2.3')})`)
      continue
    }

    if (name in type) {

      let existing = type[name]

      // if method is already natively defined, skip it
      if (isNative(existing)) {
        warn(`Skipping method ${green(name)} because it is already natively installed on ${blue(type)}`)
        continue
      }

      // if property is defined by something else, skip it
      if (!authors.has(type)(name)) {
        warn(`Skipping method ${green(name)} because it is already defined on ${blue(type)} by some library outside of ESlib`)
        continue
      } else {

        // if method is defined by another eslib, skip it
        if (authors.get(type)(name) !== author) {
          warn(`Skipping method ${green(name)} (provided by ${cyan(author)}) on ${blue(type)} because another method with the same name was already installed by ${cyan(authors.get(type)(name))}`)
          continue
        }

        // if method is defined by the same eslib at an incompatible version, skip it
        if (!isCompatible(type)(name)(author)(version)) {
          warn(`Skipping method ${green(name)} at version ${magenta(version)} (provided by ${cyan(author)}) because a${gte(versions.get(type)(name) || '0.0.0', version) ? ' newer' : 'n older'} version ${magenta(versions.get(type)(name))} is already installed on ${blue(type)}.`)
          continue
        }
      }
    }

    authors.set(type)(name)(author)
    versions.set(type)(name)(version)

    Object.defineProperty(type, name, {
      configurable: false,
      enumerable: false,
      writable: true, // allow overwriting in subsequent calls
      value: fn
    })

  }
}
