/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'
// To only run a test, use 'it.only' instead of 'it'.

const { assert } = require('chai')
const { fileSystem } = require('../src')
const { join, basename } = require('path')

describe('fileSystem', () => {
	describe('#exists', () => {
		it('Should check if a file exists or not.', async () => {
			const [,value01] = await fileSystem.exists(join(__dirname, './mocks/dummy_base64.txt'))
			const [,value02] = await fileSystem.exists(join(__dirname, './mocks/dummy_base644.txt'))
			assert.isOk(value01)
			assert.isNotOk(value02)
		})
		it('Should check if a folder exists or not.', async () => {
			const [,value01] = await fileSystem.exists(join(__dirname, './mocks/dummy_folder'))
			const [,value02] = await fileSystem.exists(join(__dirname, './mocks/dummy'))
			assert.isOk(value01)
			assert.isNotOk(value02)
		})
	})
	describe('#file.list', () => {
		it('Should list all files that are immediately under a folder.', async () => {
			const [,files] = await fileSystem.file.list(join(__dirname, './mocks'))
			assert.isOk(files)
			assert.equal(files.length, 2)
			assert.equal(basename(files[0]), 'dummy_base64.txt')
			assert.equal(basename(files[1]), 'dummy_json.txt')
		})
		it('Should return an empty array when the folder does not exist.', async () => {
			const [,files] = await fileSystem.file.list(join(__dirname, './mockss'))
			assert.isOk(files)
			assert.equal(files.length, 0)
		})
		it('Should list all files that under a folder when using the `pattern:"**/*.*"` options.', async () => {
			const [,files] = await fileSystem.file.list(join(__dirname, './mocks'), { pattern:'**/*.*' })
			assert.isOk(files)
			assert.equal(files.length, 4)
			assert.equal(basename(files[0]), 'dummy_base64.txt')
			assert.equal(basename(files[1]), 'dummy_json.txt')
			assert.equal(basename(files[2]), 'dummy_markdown.md')
			assert.equal(basename(files[3]), 'dummy_text.txt')
		})
		it('Should filter the files that are under a folder when using the `pattern` options.', async () => {
			const [,files] = await fileSystem.file.list(join(__dirname, './mocks'), { pattern:'**/*.md' })
			assert.isOk(files)
			assert.equal(files.length, 1)
			assert.equal(basename(files[0]), 'dummy_markdown.md')
		})
	})
	describe('#file.read', () => {
		it('Should read a file\'s content into a Buffer by default.', async () => {
			const [,content] = await fileSystem.file.read(join(__dirname, './mocks/dummy_base64.txt'))
			assert.isOk(content)
			assert.isOk(content instanceof Buffer)
		})
		it('Should return an error when the file does not exist.', async () => {
			const [errors, content] = await fileSystem.file.read(join(__dirname, './mocks/dummy_base64.tt'))
			assert.isOk(errors)
			assert.isNotOk(content)
			assert.include(errors[0].message, 'Failed to read file')
		})
		it('Should read a file\'s content and decode to string via the options \'encoding\'.', async () => {
			const [,content] = await fileSystem.file.read(join(__dirname, './mocks/dummy_folder/dummy_text.txt'), { encoding:'string' })
			assert.isOk(content)
			assert.equal(content, 'Hello text')
		})
		it('Should read a file\'s content and decode to JSON via the options \'encoding\'.', async () => {
			const [,content] = await fileSystem.file.read(join(__dirname, './mocks/dummy_json.txt'), { encoding:'string' })
			assert.isOk(content)
			assert.equal(typeof(content), 'string')
			const [,content02] = await fileSystem.file.read(join(__dirname, './mocks/dummy_json.txt'), { encoding:'json' })
			assert.isOk(content02)
			assert.equal(content02.name, 'dummy_json.txt')
			assert.equal(content02.content, 'Bla')
		})
	})
	describe('#dir.loadContent', () => {
		it('Should load all files\' content that are immediately under a folder.', async () => {
			const [,files] = await fileSystem.dir.loadContent(join(__dirname, './mocks'))
			assert.isOk(files)
			assert.equal(files.length, 2)
			assert.equal(basename(files[0].file), 'dummy_base64.txt')
			assert.equal(basename(files[1].file), 'dummy_json.txt')
			assert.isOk(files[0].content)
			assert.isOk(files[1].content)
		})
		it('Should load all files\' content as strings that are immediately under a folder.', async () => {
			const [,files] = await fileSystem.dir.loadContent(join(__dirname, './mocks'), { encoding:'string' })
			assert.isOk(files)
			assert.equal(files.length, 2)
			assert.equal(basename(files[0].file), 'dummy_base64.txt')
			assert.equal(basename(files[1].file), 'dummy_json.txt')
			assert.equal(files[0].content, 'aGVsbG8gd29ybGQ=')
			assert.equal(files[1].content, '{\n\t"name": "dummy_json.txt",\n\t"content": "Bla"\n}')
		})
		it('Should return an empty array when the folder does not exist.', async () => {
			const [,files] = await fileSystem.dir.loadContent(join(__dirname, './mockss'))
			assert.isOk(files)
			assert.equal(files.length, 0)
		})
		it('Should load all files\' content under a folder when using the `pattern:"**/*.*"` options.', async () => {
			const [,files] = await fileSystem.dir.loadContent(join(__dirname, './mocks'), { pattern:'**/*.*' })
			assert.isOk(files)
			assert.equal(files.length, 4)
			assert.equal(basename(files[0].file), 'dummy_base64.txt')
			assert.equal(basename(files[1].file), 'dummy_json.txt')
			assert.equal(basename(files[2].file), 'dummy_markdown.md')
			assert.equal(basename(files[3].file), 'dummy_text.txt')
			assert.isOk(files[0].content)
			assert.isOk(files[1].content)
			assert.isOk(files[2].content)
			assert.isOk(files[3].content)
		})
		it('Should filter the files\' content that are under a folder when using the `pattern` options.', async () => {
			const [,files] = await fileSystem.dir.loadContent(join(__dirname, './mocks'), { pattern:'**/*.md' })
			assert.isOk(files)
			assert.equal(files.length, 1)
			assert.equal(basename(files[0].file), 'dummy_markdown.md')
			assert.isOk(files[0].content)
		})
	})
})









