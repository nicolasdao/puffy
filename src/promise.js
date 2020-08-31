/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { math } = require('./core')

const TIMEOUT = 'RJDtm78=_timeout'

/**
 * Create an empty promise that returns after a certain delay. This promise also contain an extra API called 'cancel' which allows to
 * cancel the execution of that promise (e.g., p.cancel())
 * 
 * @param  {Number|[Number]} timeout 	If array, it must contain 2 numbers representing an interval used to select a random number
 * @return {Promise}         			Cancellable promise
 */
const delay = (timeout) => {
	let tRef
	let finished = false
	let output = Promise.resolve(null).then(() => {
		let t = timeout || 100
		if (Array.isArray(timeout)) {
			if (timeout.length != 2)
				throw new Error('Wrong argument exception. When \'timeout\' is an array, it must contain exactly 2 number items.')

			const start = timeout[0] * 1
			const end = timeout[1] * 1

			if (isNaN(start))
				throw new Error(`Wrong argument exception. The first item of the 'timeout' array is not a number (current: ${timeout[0]})`)

			if (isNaN(end))
				throw new Error(`Wrong argument exception. The second item of the 'timeout' array is not a number (current: ${timeout[1]})`)

			if (start > end)
				throw new Error(`Wrong argument exception. The first number of the 'timeout' array must be strictly smaller than the second number (current: [${timeout[0]}, ${timeout[1]}])`)			

			t = math.randomNumbers({ start, end })
		}
		
		return new Promise(onSuccess => {
			tRef = setTimeout(() => {
				finished = true
				onSuccess()
			}, t)
		})
	})

	output.cancel = () => {
		if (!finished)
			clearTimeout(tRef) 
	}

	return output
}

const wait = (stopWaiting, options) => Promise.resolve(null).then(() => {
	const now = Date.now()
	const { timeout=300000, start=now, interval=2000 } = options || {}
	
	if ((now - start) > timeout)
		throw new Error('timeout')
	
	return Promise.resolve(null).then(() => stopWaiting()).then(stop => {
		if (stop)
			return
		else
			return delay(interval).then(() => wait(stopWaiting, { timeout, start, interval }))
	})
})

/**
 * Retries failed functions max 5 times by default, using an increasing time period after each retry (starting at 5 sec. by default). 
 * 
 * @param  {Function} fn        		Parameterless function that must be retried if something goes wrong.
 * @param  {Function} retryOnSuccess 	Optional, default () => false. (res, options) => Returns a boolean or a Promise returning a boolean. The boolean 
 *                                 		determines if the response is value (false) or if we need to proceed to a retry (true). 
 * @param  {Function} retryOnFailure 	Optional, default () => true. (error, options) => Returns a boolean or a Promise returning a boolean. The boolean 
 *                                  	determines if the error leads to a retry (true) or if the error should interrupt the 'retry' function and make it fail (true).
 * @param  {Boolean}  toggle   			Optional, default true. When set to false, the 'retry' is not toggled.
 * @param  {Number}   retryAttempts   	Optional, default: 5. Number of retry
 * @param  {Number}   attemptsCount   	Read only. Current retry count. When that counter reaches the 'retryAttempts', the function stops. This might be a usefull piece of
 *                                     	information for the 'retryOnSuccess' and 'retryOnFailure'.
 * @param  {Number}   timeout   		Optional, default null. If specified, 'retryAttempts' and 'attemptsCount' are ignored
 * @param  {Number}   retryInterval   	Optional, default: 5000. Time interval in milliseconds between each retry. It can also be a 2 items array.
 *                                    	In that case, the retryInterval is a random number between the 2 ranges (e.g., [10, 100] => 54).
 *                                     	The retry strategy increases the 'retryInterval' by a factor 1.5 after each failed attempt.
 * @param  {Boolean}  ignoreError   	Optional, default false. Only meaninfull when 'retryOnSuccess' is explicitly set. If set to true, the 'retry' 
 *                                   	function returns the 'fn''s output instead of throwing an exception when the last attempt to execute 'retryOnSuccess'
 *                                   	fails.
 * @param  {String}   errorMsg   		Optional, default `${retryAttempts} attempts to retry the procedure failed to pass the test.`. Customize the exception message in case of failure.
 * @return {Promise}             		Promise that return whatever is returned by 'fn'
 * @catch  {String}   err.message
 * @catch  {String}   err.stack
 * @catch  {Object}   err.data.data		In case of timeout, the data is what was last returned by 'fn'
 * @catch  {Object}   err.data.error	In case of timeout, the data is what was last returned by 'fn'
 */
const retry = ({ fn, retryOnSuccess, retryOnFailure, toggle, retryAttempts, retryInterval, attemptsCount, timeout, ignoreError, errorMsg, ignoreTimout }) => { 
	toggle = toggle === undefined ? true : toggle
	retryOnSuccess = retryOnSuccess || (() => false)
	retryOnFailure = !toggle ? (() => false) : (retryOnFailure || (() => true))
	const options = { toggle, retryAttempts, retryInterval, attemptsCount, timeout, ignoreError, errorMsg  }
	const explicitretryOnSuccess = !retryOnSuccess
	const mainPromise = Promise.resolve(null)
		.then(() => fn()).then(data => ({ error: null, data }))
		.catch(error => ({ error, data: null }))
		.then(({ error, data }) => Promise.resolve(null)
			.then(() => {
				if (error && retryOnFailure)
					return retryOnFailure(error, options)
				else if (error)
					throw error 
				else
					return !retryOnSuccess(data, options)
			})
			.then(passed => {
				if (!error && passed)
					return data
				else if ((!error && !passed) || (error && passed)) {
					let { retryAttempts=5, retryInterval=5000, attemptsCount=0 } = options
					const delayFactor = (attemptsCount+1) <= 1 ? 1 : Math.pow(1.5, attemptsCount)

					const i = Array.isArray(retryInterval) && retryInterval.length > 1
						? (() => {
							if (typeof(retryInterval[0]) != 'number' || typeof(retryInterval[1]) != 'number')
								throw new Error(`Wrong argument exception. When 'options.retryInterval' is an array, all elements must be numbers. Current: [${retryInterval.join(', ')}].`)
							if (retryInterval[0] > retryInterval[1])
								throw new Error(`Wrong argument exception. When 'options.retryInterval' is an array, the first element must be strictly greater than the second. Current: [${retryInterval.join(', ')}].`)

							return math.randomNumber(retryInterval[0], retryInterval[1])
						})()
						: retryInterval

					const delayMs = Math.round(delayFactor*i)

					if (attemptsCount < retryAttempts) 
						return delay(delayMs).then(() => retry({ ...options, fn, retryOnSuccess, retryOnFailure, attemptsCount:attemptsCount+1, ignoreTimout:true }))
					else if (explicitretryOnSuccess && options.ignoreError)
						return data
					else {
						let e = new Error(options.errorMsg ? options.errorMsg : `${retryAttempts} attempt${retryAttempts > 1 ? 's' : ''} to retry the procedure failed to pass the test.`)
						e.data = {
							data,
							error
						}
						throw e
					}
				} else 
					throw error
			})
		)

	return (timeout > 0 && !ignoreTimout ? Promise.race([delay(timeout).then(() => TIMEOUT), mainPromise]) : mainPromise).then(data => {
		if (data === TIMEOUT)
			throw new Error('Retry method timeout.')
		return data
	})
}

const runOnce = (fn) => {
	let _fn
	return (...args) => {
		if (!_fn)
			_fn = Promise.resolve(null).then(() => fn(...args))
		return _fn
	}
}

module.exports = {
	delay,
	wait,
	retry,
	runOnce
}
