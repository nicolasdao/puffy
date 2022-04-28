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
const { validate } = require('../src')

describe('validate', () => {
	describe('#url', () => {
		it('01 - Should validate that a URL is valid or not.', () => {
			const goodUrls = [
				'https://cloudlessconsulting.com', 
				'http://www.example.com/dewde?query=hello#world', 
				'http://localhost:80'
			]
			const badUrls = [
				null, 
				'hello', 
				'https:cs.com', 
				'https://example', 
				'http://'
			]
			
			let counter = 0
			for (let url of goodUrls)
				assert.isOk(validate.validateUrl(url), `${++counter} - ${url} should be a valid URL.`)
			for (let url of badUrls)
				assert.isNotOk(validate.validateUrl(url), `${++counter} - ${url} should be an invvalid URL.`)
		})
	})
})








