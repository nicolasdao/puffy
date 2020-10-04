/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { promise:{ retry, delay } } = require('../src')

describe('promise', () => {
	describe('#retry', () => {
		it('01 - Should retry 5 times the failing functions before fully failing', done => {
			let counter = 0
			const fn = () => { 
				throw new Error(`${++counter}`)
			}

			retry({ fn, retryInterval:2 })
				.then(() => done(new Error('Should have failed')))
				.catch(err => {
					assert.equal(err.message, '5 attempts to retry the procedure failed to pass the test.', '01')
					assert.equal(err.data.error.message, '6',)
					done()
				})
		})
		it('02 - Should eventually succeed if 5 retries are enough.', done => {
			let counter = 0
			const fn = () => { 
				if (counter == 3)
					return { message:'yes' }
				throw new Error(`${++counter}`)
			}

			retry({ fn, retryInterval:2 })
				.then(data => {
					assert.equal(data.message, 'yes', '01')
					assert.equal(counter, 3, '02')
					done()
				})
				.catch(err => {
					done(new Error(`Should have worked. Details: ${err.message}\n${err.stack}`))
				})
		})
		it('03 - Should not retry when some specific error occurs.', done => {
			let counter = 0
			const fn = () => { 
				throw new Error(`${++counter}`)
			}

			const retryOnFailure = (error) => error.message != '3'

			retry({ fn, retryInterval:2, retryOnFailure })
				.then(() => done(new Error('Should have failed')))
				.catch(err => {
					assert.equal(err.message, '3', '01')
					done()
				})
				.catch(done)
		})
		it('04 - Should retry when some valid response fails to pass the test.', done => {
			let counter = 0
			const fn = () => ++counter

			const retryOnSuccess = (data) => data < 3

			retry({ fn, retryInterval:2, retryOnSuccess })
				.then(data => {
					assert.equal(data, 3, '01')
					assert.equal(counter, 3, '02')
					done()
				})
				.catch(err => {
					done(new Error(`Should have worked. Details: ${err.message}\n${err.stack}`))
				})
		})
		it('05 - Should support modifying the retry attempts.', done => {
			let counter = 0
			const fn = () => ++counter

			const retryOnSuccess = (data) => data < 3

			retry({ fn, retryInterval:2, retryOnSuccess, retryAttempts:1 })
				.then(() => done(new Error('Should have failed')))
				.catch(err => {
					assert.equal(err.message, '1 attempt to retry the procedure failed to pass the test.', '01')
					done()
				})
				.catch(done)
		})
		it('06 - Should support timing out.', done => {
			let counter = 0
			const fn = () => ++counter

			const retryOnSuccess = (data) => data < 3

			retry({ fn, retryOnSuccess, timeout:20 })
				.then(() => done(new Error('Should have failed')))
				.catch(err => {
					assert.equal(err.message, 'Retry method timeout.', '01')
					done()
				})
				.catch(done)
		})
	})
	describe('#delay', () => {
		it('01 - Should delay execution.', done => {
			const seq = []
			const start = Date.now()
			delay(20).then(() => seq.push({ id:3, time: Date.now() - start }))
			delay(10).then(() => seq.push({ id:1, time: Date.now() - start }))
			delay(15).then(() => seq.push({ id:2, time: Date.now() - start }))
			delay(25).then(() => {
				assert.equal(seq.length, 3, '01')
				assert.equal(seq[0].id, 1, '02')
				assert.equal(seq[1].id, 2, '03')
				assert.equal(seq[2].id, 3, '04')
				done()
			}).catch(done)
		})
		it('02 - Should support cancelling a delayed execution.', done => {
			const seq = []
			const start = Date.now()
			const d_01 = delay(20)
			const d_03 = delay(15)
			const d_02 = delay(10).then(() => d_01.cancel())
			d_01.then(() => seq.push({ id:3, time: Date.now() - start }))
			d_02.then(() => seq.push({ id:1, time: Date.now() - start }))
			d_03.then(() => seq.push({ id:2, time: Date.now() - start }))
			delay(25).then(() => {
				assert.equal(seq.length, 2, '01')
				assert.equal(seq[0].id, 1, '02')
				assert.isOk(10 <= seq[0].time && seq[0].time <= 15 , '03')
				assert.equal(seq[1].id, 2, '04')
				assert.isOk(15 <= seq[1].time && seq[1].time <= 20 , '05')
				done()
			}).catch(done)
		})
	})
})








