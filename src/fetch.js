/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fs = require('fs')
// const fetch = require('node-fetch')
const { Writable } = require('stream')
const { getInfo } = require('./url')
const FormData = require('form-data')
const { retry } = require('./promise')

/**
 * Transforms the HTTP respnse into something readable.
 * 
 * @param  {Response} res     				
 * @param  {String}   uri     				
 * @param  {Writable} options.streamReader 	
 * @param  {String}   options.dst		Path to a destination file
 * @param  {String}   options.parsing		e.g., 'json' to force the parsing method to json. Valid values: 'json', 'text', 'buffer'
 * 
 * @yield {Number}   		output.status
 * @yield {Object}   		output.data
 * @yield {Object}   		output.headers        				
 */
const _processResponse = (res, uri, options={}) => {
	let contentType = res && res.headers && typeof(res.headers.get) == 'function' ? res.headers.get('content-type') : null	
	const { ext, contentType:ct } = getInfo(uri || '')
	contentType = contentType || ct
	
	const isBuffer = options.parsing == 'buffer'
	const isText = !isBuffer && (options.parsing == 'text' || (!options.dst && !options.streamReader && contentType && contentType.match(/(text|html|css|xml|javascript|rss|csv)/)))
	const isJson = !isBuffer && (options.parsing == 'json' || (!options.dst && !options.streamReader && (!ext || !contentType || contentType.match(/json/))))

	const getData = isText 
		? res.text()
		: isJson
			? res.json()
			: (() => {
				const chunks = []
				const customStreamReader = options.streamReader && (options.streamReader instanceof Writable)
				const writeResponseToFile = options.dst
				const dontReturnResp = customStreamReader || writeResponseToFile
				const reader = writeResponseToFile 
					? fs.createWriteStream(options.dst)
					: customStreamReader
						? options.streamReader
						: new Writable({
							write(chunk, encoding, callback) {
								chunks.push(chunk)
								callback()
							}
						})
				return new Promise((onSuccess, onFailure) => {
					res.body.pipe(reader)
					res.body.on('close', () => onSuccess())
					res.body.on('end', () => onSuccess())
					res.body.on('finish', () => onSuccess())
					res.body.on('error', err => onFailure(err))
				}).then(() => dontReturnResp ? null : Buffer.concat(chunks))
			})()

	return getData
		.then(data => ({ status: res.status, data, headers: res.headers }))
		.catch(() => ({ status: res.status, data: res, headers: res.headers }))
}

/**
 * Converts any 'body' object into a supported type by the HTTP fetch API. The rules work as follow:
 * - If the body type is native, then no need to do anything. Native types are: 
 * 		- 'string'
 * 		- 'Buffer'
 * 		- 'FormData'
 * 		- 'URLSearchParams'
 * - If the body type if not native, then use the content type defined in the 'header' object to define which type to use:
 * 		- headers['content-type']: undefined -> Convert body to string
 * 		- headers['content-type']: application/x-www-form-urlencoded -> Convert body to URLSearchParams
 * 		- headers['content-type']: multipart/form-data -> Convert body to FormData
 * 
 * @param  {String} headers['Content-Type']		HTTP request header's content type. Influences what the body's type is. 
 * @param  {Object} body						Random object that might have to be converted. 
 * @param  {Object}	file						only valid when headers['Content-Type'] is 'multipart/form-data'
 * @param  {String}		.name					e.g., 'hello.jpg'
 * @param  {String}		.boundary				e.g., '12345'
 * @param  {String}		.contentType			e.g., 'image/jpg'. Default 'application/octet-stream'
 * 
 * @return {Object}	legitBody					
 */
const _getBody = (headers, body, file) => {
	const bodyType = typeof(body)
	const nativeBody = !body || bodyType == 'string' || (body instanceof Buffer) || (body instanceof FormData) || (body instanceof URLSearchParams)
	const contentType = (!headers || typeof(headers) != 'object' 
		? ''
		: headers['Content-Type'] || headers['content-type'] || '').toLowerCase().trim()

	const isUrlEncoded = contentType == 'application/x-www-form-urlencoded'
	const isFormEncoded = contentType == 'multipart/form-data'
	
	if (nativeBody && !isFormEncoded)
		return body

	if (isUrlEncoded || isFormEncoded) {
		const bodyIsObject = body && bodyType == 'object'
		const bodyIsBuffer = bodyIsObject && body instanceof Buffer
		if (!bodyIsBuffer && bodyIsObject) {
			const params = isUrlEncoded ? new URLSearchParams() : new FormData()			
			for (let key in body) {
				const value = body[key]
				if (value !== null && value !== undefined) {
					if (isFormEncoded && typeof(value) == 'object' && !(value instanceof Buffer)) {
						const buf = Buffer.from(JSON.stringify(value))
						params.append(key, buf, { contentType:'application/json', knownLength: Buffer.byteLength(buf) })
					} else
						params.append(key, value)
				}
			}
			return params
		} else if (isFormEncoded) {
			const buf = bodyIsBuffer ? body : Buffer.from(body||'')
			const params = new FormData()
			const options = { 
				contentType: 'application/octet-stream',
				knownLength: Buffer.byteLength(buf) 
			}		
			if (file) {
				if (file.name)
					options.filename = file.name
				if (file.contentType)
					options.contentType = file.contentType
				if (file.boundary)
					params.setBoundary(file.boundary)
			}
			params.append('file', buf, options)
			return params
		} else
			return JSON.stringify(body||'')	
	} else 
		return JSON.stringify(body||'')
}

/**
 * Performs HTTP request. Examples:
 *
 * 	// Calling an API
 * 	_fetch({ uri: 'https://example.com/yourapi' }, 'GET').then(({ data }) => console.log(data)) // shows JSON object
 *
 *	// Downloading a file
 * 	_fetch({ uri: 'https://example.com/image/test.jpeg', parsing: 'buffer' }, 'GET').then(({ data }) => console.log(data)) // shows buffer
 *
 * 	// Downloading a file using a custom stream reader
 * 	const chunks = []
 * 	const customStreamReader = new Writable({
 * 		write(chunk, encoding, callback) {
 * 			chunks.push(chunk)
 * 			callback()
 * 		}
 * 	})
 *	_fetch({ uri: 'https://example.com/somefile.pdf', streamReader:customStreamReader }, 'GET').then(() => console.log(Buffer.concat(chunks)))
 *
 *  // POSTING using 'application/x-www-form-urlencoded'
 *  _fetch({ 
 *  	uri: 'https://example.com/yourapi',
 *  	headers: {
 *  		'Content-Type': 'application/x-www-form-urlencoded'
 *  	},
 *  	body: {
 *  		hello: 'world'
 *  	}
 *  }, 'POST').then(({ data }) => console.log(data)) // shows JSON object
 * 
 * @param  {String|Object}	input					e.g., 'https://example.com' or { uri: 'https://example.com' }
 * @param  {String}				.uri				e.g., 'https://example.com'
 * @param  {Object}				.headers			e.g., { Authorization: 'bearer 12345' }
 * @param  {String|Object}		.body				e.g., { hello: 'world' }
 * @param  {Object}				.file				only valid when headers['Content-Type'] is 'multipart/form-data'
 * @param  {String}					.name			e.g., 'hello.jpg'
 * @param  {String}					.boundary		e.g., '12345'
 * @param  {String}					.contentType	e.g., 'image/jpg'. Default 'application/octet-stream'
 * @param  {Writable} 			.streamReader	
 * @param  {String}				.dst				Absolute file path on local machine where to store the file (e.g., '/Documents/images/img.jpeg')
 * @param  {String} 			.parsing			Forces the response to be parsed using one of the following output formats:
 *                              				  	'json', 'text', 'buffer'
 * @param  {String}			method					Valid values: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
 * 
 * @return {Object}   		output
 * @return {Number}   			.status
 * @return {Object}   			.data
 * @return {Object}   			.headers
 */
const _fetch = (input={}, method) => {
	const { uri, headers={}, body, streamReader, dst, parsing, file, agent } = typeof(input) == 'string' ? { uri:input } : input
	const _body = _getBody(headers, body, file)
	return import("node-fetch").then(mod => mod.default(uri, { method, headers, body:_body, agent }).then(res => _processResponse(res, uri, { streamReader, dst, parsing })))
}

const postData = input => _fetch(input, 'POST')

const putData = input => _fetch(input, 'PUT')

const patchData = input => _fetch(input, 'PATCH')

const deleteData = input => _fetch(input, 'DELETE')

const getData = input => _fetch(input, 'GET')

const graphQLQuery = ({ uri, headers, query }) => {
	if (!uri)
		throw new Error('Missing required \'uri\' argument.')
	if (!query)
		throw new Error('Missing required \'query\' argument.')
	if (typeof(query) != 'string')
		throw new Error('Wrong argument exception. \'query\' must be a string.')

	const api_url = `${uri}?query=${encodeURIComponent(query)}`
	return getData({ uri:api_url, headers })
}

const graphQLMutation = ({ uri, headers, query }) => {
	if (!uri)
		throw new Error('Missing required \'uri\' argument.')
	if (!query)
		throw new Error('Missing required \'query\' argument.')
	if (typeof(query) != 'string')
		throw new Error('Wrong argument exception. \'query\' must be a string.')
	const api_url = `${uri}?query=mutation${encodeURIComponent(query)}`
	return postData({ uri:api_url, headers })
}

const retryGetData = (input, options) => retry({ 
	fn: () => getData(input), 
	...(options || {})
})

const retryGraphQLQuery = (input, options) => retry({ 
	fn: () => graphQLQuery(input), 
	...(options || {})
})

module.exports = {
	post: postData,
	'get': getData,
	put: putData,
	patch: patchData,
	delete: deleteData,
	graphql: {
		query: graphQLQuery,
		mutate: graphQLMutation,
		retry: {
			query: retryGraphQLQuery
		}
	},
	retry: {
		'get': retryGetData
	}
}
