	
# PUFFY
		
A collection of CommonJS utilities to help manage common programming tasks in NodeJS projects only. This package is designed to work along side [`puffy-core`](https://github.com/nicolasdao/puffy-core) which exposes an extra set of [usefull APIs](https://github.com/nicolasdao/puffy-core#table-of-contents) that are compatible with both NodeJS and native JS.

```
npm i puffy
```

# Table of contents

> * [APIs](#apis)
>	- [Core APIs](#core-apis)
>	- [`fetch`](#fetch)
>	- [`fileSystem`](#filesystem)
>	- [`identity`](#identity)
> * [Unit test](#unit-test)
> * [Annexes](#annexes)
>	- [Wrapping the `fetch` API into `catchErrors`](#wrapping-the-fetch-api-into-catchErrors)
> * [License](#license)

# APIs
## Core APIs

Those APIs are the ones implemented by [`puffy-core`](https://github.com/nicolasdao/puffy-core) which exposes an extra set of [usefull APIs](https://github.com/nicolasdao/puffy-core#table-of-contents). 

Example:

```js
const { collection } = require('puffy')
console.log(collection.batch([1,2,3,4,5,6,7,8,9,10],3))
```

Please refer to the puffy-core documentation to learn more about the core APIs.

> NOTE: If the APIs you need are solely contained in the `puffy-core`, we recommend to install `puffy-core` rather than `puffy`.

## `fetch`

> This API can benefit from being wrapped into the `catchErrors` API, so it becomes more reliable. To see a live example, please refer to the annexes under the [Wrapping the `fetch` API into `catchErrors`](#wrapping-the-fetch-api-into-catchErrors) section.	

```js
const { fetch } = require('puffy')

const main = async () => {
	// fetch data
	const { status, data } = await fetch.get({
		uri: 'http://localhost:4220/entry/32'
	})

	// POST using 'multipart/form-data'
	const { status, data } = await fetch.post({
		uri: 'http://localhost:4220/entry/32',
		headers: {
			'Content-Type': 'multipart/form-data'
		},
		body: {
			hello: 'World',
			myFile: document.querySelector('input[type="file"]').files[0]
		}
	})

	// POST content as file attachement
	const { status:status2, data:data2 } = await fetch.post({
		uri: 'http://localhost:4220/entry/32',
		headers: {
			'Content-Type': 'multipart/form-data'
		},
		body: 'hello world', // This could be a Buffer from a local file.
		file: {
			name: 'my_cool_file.txt',
			contentType: 'text/plain', // Default: 'application/'
			boundary: 'hello' // if this not specified, a random number is used.
		}
	})

	// POST URL encoded data
	const { status:status2, data:data2 } = await fetch.post({
		uri: 'http://localhost:4220/entry/32',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: {
			hello: 'World'
		}
	})

	// GraphQL
	const { status:status3, data:data3 } = await fetch.graphql.query({ 
		uri: 'http://localhost:4220/graphql', 
		headers:{}, 
		query: `{ 
			users(where:{ id:1 }){ 
				id 
				name 
			} 
		}` 
	})

	const { status:status4, data:data4 } = await fetch.graphql.mutate({ 
		uri: 'http://localhost:4220/graphql', 
		headers:{}, 
		query: `{ 
			userInsert(input:{ name:"Nic" }){ 
				id 
				name 
			} 
		}` 
	})
}

main()
```

## `fileSystem`

```js
const { fileSystem } = require('puffy')
const { join } = require('path')

const filePath = join(__dirname, './LICENSE')
const folderPath = __dirname

const main = async () => {

	// fileSystem.exist API
	const [fileExistsErrors, fileExists] = await fileSystem.exists(filePath)
	if (fileExistsErrors)
		throw fileExistsErrors[0]
	console.log(`File '${filePath}' exists: ${fileExists}`) 




	// fileSystem.file.read API
	const [contentBufErrors, contentBuf] = await fileSystem.file.read(filePath)
	if (contentBufErrors)
		throw contentBufErrors[0]
	console.log(contentBuf) // <Buffer 42 53 44 ... 1486 more bytes>

	const [contentErrors, content] = await fileSystem.file.read(filePath, { encoding:'string' })
	if (contentErrors)
		throw contentErrors[0]
	console.log(content) // Hello world




	// fileSystem.file.list API
	const [files01Errors, files01] = await fileSystem.file.list(folderPath) // Returns all the files directly under 'folderPath'
	if (files01Errors)
		throw files01Errors[0]
	console.log(files01) // ['/Users/you/CHANGELOG.md', ..., '/Users/you/package.json']

	const [files02Errors, files02] = await fileSystem.file.list(folderPath, { pattern:'**/*.*' }) // Returns all the files under 'folderPath', incl. files under the nested folders.
	if (files02Errors)
		throw files02Errors[0]
	console.log(files02) // ['/Users/you/CHANGELOG.md', ... 4820 more items]
	
	const [files03Errors, files03] = await fileSystem.file.list(folderPath, { pattern:'**/*.*', ignore:'**/node_modules/**' }) // Returns all the files under 'folderPath', incl. files under the nested folders, except the 'node_modules' folder.
	if (files03Errors)
		throw files03Errors[0]
	console.log(files03) // ['/Users/you/CHANGELOG.md', ... 100 more items]




	// fileSystem.dir.loadContent API (same API signatures as fileSystem.file.list)
	const [filesContent01Errors, filesContent01] = await fileSystem.dir.loadContent(folderPath) // Returns all the files directly under 'folderPath'
	if (filesContent01Errors)
		throw filesContent01Errors[0]
	console.log(filesContent01) // [{ file:'/Users/you/CHANGELOG.md', content:<Buffer 23 20 50...> }, ..., { file: '/Users/you/package.json', content:<Buffer 23 20 50...> }]

	const [filesContent02Errors, filesContent02] = await fileSystem.dir.loadContent(folderPath, { encoding:'string' }) // Returns all the files directly under 'folderPath'
	if (filesContent02Errors)
		throw filesContent02Errors[0]
	console.log(filesContent02) // [{ file:'/Users/you/CHANGELOG.md', content:'Hello...' }, ..., { file: '/Users/you/package.json', content:'World...' }]




	// fileSystem.file.write API
	const [newFile01Errors] = await fileSystem.file.write(join(__dirname, './newfile.txt'), 'hello new file')
	if (newFile01Errors)
		throw newFile01Errors[0]

	const [newFile02Errors] = await fileSystem.file.write(join(__dirname, './newfile.txt'), 'something else that overrides the previous content')
	if (newFile02Errors)
		throw newFile02Errors[0]

	const [newFile03Errors] = await fileSystem.file.write(join(__dirname, './newfile.txt'), 'more content', { append:true }) // By default the appendSep is '\n'
	if (newFile03Errors)
		throw newFile03Errors[0]

	const [newFile04Errors] = await fileSystem.file.write(join(__dirname, './newfile.txt'), ' that is important', { append:true, appendSep:'' }) // append the new content on the last line.
	if (newFile04Errors)
		throw newFile04Errors[0]




	// fileSystem.file.delete API
	const [deleteErrors] = await fileSystem.file.delete(join(__dirname, './newfile.txt'))
	if (deleteErrors)
		throw deleteErrors[0]
}

main()
```

## `identity`

```js
const { identity } = require('puffy')

console.log(identity.new()) // m1dyRsRRPR
console.log(identity.new({ long:true })) // LV6EBIpXWchZmXpOvtKh
console.log(identity.new({ long:true, sep:'-' })) // oF5xh-U499Q-1PDcE-sY6Xu
console.log(identity.new({ long:true, sep:'-', lowerCase:true })) // m49q9-3xcaa-zmtes-p7fip
```

# Unit test

```
npm test
```

# Annexes
## Wrapping the `fetch` API into `catchErrors`

```js
const { fetch, error: { catchErrors, wrapErrorsFn } } = require('puffy')

const apiFetch = verb => 
	/**
	 * `
	 * @param	{String}	endpoint	e.g., 'v1/profile' or '/v3/user'
	 * @param	{Object}	options
	 * @param	{Object}		.headers
	 * @param	{Object}		.body
	 * 
	 * @return {Object}	resp
	 * @return {Number}		.status
	 * @return {Object}		.data
	 */
	(endpoint, options) => catchErrors((async () => {
		const httpVerb = (verb||'').trim().toUpperCase()
		const e = wrapErrorsFn(`Failed to execute HTTP ${httpVerb}`)
		if (!verb)
			throw e('Missing required argument \'verb\'')
		if (!endpoint)
			throw e('Missing required argument \'endpoint\'')
		if (!process.env.API_KEY)
			throw e('Missing required environment variable \'API_KEY\'')
		if (!process.env.BASE_URL)
			throw e('Missing required environment variable \'BASE_URL\'')

		endpoint = (endpoint||'').trim().replace(/^\//,'')

		if (!endpoint)
			throw e('Wrong argument exception. \'endpoint\' cannot be empty.')

		const uri = `${process.env.BASE_URL}/${endpoint}`

		const verbApi = verb.trim().toLowerCase() 
		if (!fetch[verbApi])
			throw e(`Wrong argument exception. 'verb'	value '${verb}' not supported.`)		

		const { headers, body } = options || {}
		const { status, data } = await fetch[verbApi]({ 
			uri, 
			headers: { ...(headers||{}), Authorization: `Bearer ${process.env.API_KEY}` }, 
			body 
		})

		if (!status || status > 399)
			throw e(`HTTP ${httpVerb} failed (status ${status||'UNKNOWN_CODE'}). Details: ${JSON.stringify(data||{})}`)

		return { status, data }
	})())

module.exports = {
	api: {
		'get': apiFetch('get'),
		'post': apiFetch('post'),
		'put': apiFetch('put'),
		'delete': apiFetch('delete')
	}
}
```

# License

BSD 3-Clause License

Copyright (c) 2019-2021, Cloudless Consulting Pty Ltd
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
	 list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
	 this list of conditions and the following disclaimer in the documentation
	 and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
	 contributors may be used to endorse or promote products derived from
	 this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
