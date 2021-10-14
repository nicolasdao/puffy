/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// v0.0.4

const crypto = require('crypto')

/**
 * Returns a unique identifier (default length 10)
 * @param  {Boolean} options.short 		Default false. If set to true, the id length will be 5
 * @param  {Boolean} options.long 		Default false. If set to true, the id length will be 20
 * @param  {String}  options.sep 		Default ''. Not valid when options.short is true
 * @param  {Boolean} options.lowerCase 		Default false.
 * @param  {Boolean} options.uriReady 		Default false. When true, this will encode the id so that it can be used into a URI
 * @return {String}         			[description]
 */
const newId = (options={}) => {
	const sep = options.sep || ''
	const getId = options.lowerCase 
		? () => crypto.randomBytes(7).toString('base64').replace(/[+=]/g, 'p').replace(/\//g, '9').toLowerCase().slice(0,5)
		: () => crypto.randomBytes(7).toString('base64').replace(/[+=]/g, 'p').replace(/\//g, '9').slice(0,5)

	const id = options.short ? getId() : options.long ? `${getId()}${sep}${getId()}${sep}${getId()}${sep}${getId()}` : `${getId()}${sep}${getId()}`
	return options.uriReady ? encodeURIComponent(id) : id
}

module.exports = {
	'new': newId
}
