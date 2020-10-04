/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { obj:{ merge, mirror, set:setProperty} } = require('../src')

describe('obj', () => {
	describe('#merge', () => {
		it('01 - Should merge objects', () => {
			const o1 = {
				project: {
					name: 'P1',
					updated: 'Tuesday'
				}
			}
			const o2 = {
				id: 1,
				project: {
					description: 'Cool cool',
					updated: 'Wednesday'
				}
			}

			assert.deepEqual(merge(o1,o2), { id:1, project:{ name:'P1', updated:'Wednesday', description:'Cool cool'} })
		})
		it('02 - Should support nullifying certain propertiess', () => {
			const o1 = {
				project: {
					name: 'P1',
					updated: 'Tuesday'
				}
			}
			const o2 = {
				id: 1,
				project: {
					description: 'Cool cool',
					updated: null
				}
			}

			assert.deepEqual(merge(o1,o2), { id:1, project:{ name:'P1', updated:null, description:'Cool cool'} })
		})
	})
	describe('#mirror', () => {
		it('Should mirror an object properties', () => {
			const o1 = {
				project: {
					name: 'P1',
					updated: 'Tuesday'
				}
			}
			const o2 = {
				id: 1,
				project: {
					description: 'Cool cool',
					updated: 'Wednesday'
				}
			}

			assert.deepEqual(mirror(o1,o2), { id:1, project:{ updated:'Tuesday', description:'Cool cool'} })
			assert.deepEqual(mirror(o2,o1), { project:{ name: 'P1', updated:'Wednesday'} })
		})
	})
	describe('#set', () => {
		it('Should set a specific object\'s property value/', () => {
			const o = setProperty(setProperty({ name:'Nic' }, 'company.name', 'Neap Pty Ltd'), 'age', 38)

			assert.equal(o.name, 'Nic', '01')
			assert.equal(o.company.name, 'Neap Pty Ltd', '02')
			assert.equal(o.age, 38, '03')
		})
	})
})








