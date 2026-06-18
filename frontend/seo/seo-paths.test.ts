import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {afterEach, describe, expect, it} from 'vitest'

import {toCsv, writeCsv} from './seo-paths.mjs'

describe('toCsv', () => {
  it('writes a header row and trailing CRLF', () => {
    const csv = toCsv(['a', 'b'], [['1', '2']])
    expect(csv).toBe('a,b\r\n1,2\r\n')
  })

  it('quotes cells containing commas', () => {
    const csv = toCsv(['x'], [['hello, world']])
    expect(csv).toBe('x\r\n"hello, world"\r\n')
  })

  it('escapes embedded double-quotes by doubling them', () => {
    const csv = toCsv(['x'], [['she said "hi"']])
    expect(csv).toBe('x\r\n"she said ""hi"""\r\n')
  })

  it('quotes cells containing newlines (CR or LF)', () => {
    const csvLf = toCsv(['x'], [['line1\nline2']])
    expect(csvLf).toBe('x\r\n"line1\nline2"\r\n')

    const csvCr = toCsv(['x'], [['line1\rline2']])
    expect(csvCr).toBe('x\r\n"line1\rline2"\r\n')
  })

  it('leaves plain cells unquoted', () => {
    const csv = toCsv(['x'], [['plain']])
    expect(csv).toBe('x\r\nplain\r\n')
  })

  it('renders null/undefined cells as empty strings', () => {
    const csv = toCsv(['a', 'b'], [[null, undefined]])
    expect(csv).toBe('a,b\r\n,\r\n')
  })

  it('supports {header, key} columns reading from object rows', () => {
    const csv = toCsv(
      [
        {header: 'Name', key: 'name'},
        {header: 'Count', key: 'count'},
      ],
      [{name: 'Acme', count: 3}],
    )
    expect(csv).toBe('Name,Count\r\nAcme,3\r\n')
  })

  it('falls back to the header name when a column has no key (object row)', () => {
    const csv = toCsv([{header: 'Name'}], [{Name: 'Bob'}])
    expect(csv).toBe('Name\r\nBob\r\n')
  })
})

describe('writeCsv', () => {
  const tmpFiles: string[] = []
  afterEach(() => {
    for (const f of tmpFiles.splice(0)) {
      fs.rmSync(path.dirname(f), {recursive: true, force: true})
    }
  })

  it('creates the directory, writes the CSV, and returns the path written', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-paths-'))
    const target = path.join(dir, 'nested', 'out.csv')
    tmpFiles.push(target)

    const returned = writeCsv(target, ['a', 'b'], [['1', '2']])

    expect(returned).toBe(target)
    expect(fs.existsSync(target)).toBe(true)
    expect(fs.readFileSync(target, 'utf8')).toBe('a,b\r\n1,2\r\n')
  })
})
