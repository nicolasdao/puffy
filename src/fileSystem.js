/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { error: { catchErrors, wrapErrorsFn } } = require('puffy-core')
const fs = require('fs')
const { join } = require('path')
const fg = require('fast-glob')

/**
 * Checks if a path exists or not. 
 * 
 * @param  {String}		filePath	
 * 
 * @return {Array}		output[]
 * @return {[Error]}		[0]		Errors. Null means no errors occured.
 * @return {Boolean}		[1]		Result.
 */
const fileOrFolderExists = filePath => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to check if path '${filePath}' exists.`)
	if (!filePath)
		throw e('Missing required argument \'filePath\'.')

	const result = await new Promise(onSuccess => fs.exists((filePath), yes => onSuccess(yes ? true : false)))
	return result
})())

//
// Gets an array of absolute file paths located under the 'folderPath', or a Channel that streams those files.
// 
// @param  {String}				folderPath			Absolute or relative path to folder
// @param  {Object}				options
// @param  {String|[String]}		.pattern		Default is '*.*' which means all immediate files. To get all the files
//													use '**/*.*'. To include the hidden files, use: ['**/*.*', '**/.*/*'].
// @param  {String|[String]}		.ignore			e.g., '**/node_modules/**'
// @param  {Channel}				.channel		When a channel is passed, all files are streamed to that channel instead of 
//													being returned as an array. The last file found add a specific string on 
//													the channel to indicates that the scan is over. That string value is: 'end'.
//											
// @return {Array}				output[]
// @return {[Error]}				[0]				Errors. Null means no errors occured.
// @return {[String]}				[1]				If a channel is passed via 'options.channel', than the output is null and 
// 													the files are streamed to that channel.
//
const listFiles = (folderPath, options={}) => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to list files under directory '${folderPath}'.`)
	if (!folderPath)
		throw e('Missing required argument \'folderPath\'.')

	const pattern = options.pattern || '*.*'
	const ignore = options.ignore
	const channel = options.channel
	const patterns = (typeof(pattern) == 'string' ? [pattern] : pattern).map(p => join(folderPath, p))
	const opts = ignore ? { ignore:(typeof(ignore) == 'string' ? [ignore] : ignore).map(p => join(folderPath, p)) } : {}

	if (!channel) {
		const [errors, data] = await catchErrors(fg(patterns, opts))
		if (errors)
			throw e(errors)
		return data || []
	} else {
		const stream = fg.stream(patterns,opts)
		stream.on('data', data => {
			channel.put(data)
		})
		stream.on('end', () => {
			channel.put('end')
			stream.destroy()
		})
		stream.on('error', err => {
			console.log(`An error happened while streaming files from ${folderPath}: ${err}`)
			stream.destroy()
		})

		return null
	}
})())

/**
 * Gets a file under a Google Cloud Storage's 'filePath'.
 * 
 * @param  {String}		filePath	
 * @param  {Object}		options	
 * @param  {String}			.encoding	Valid values: 'buffer'(default), 'string', 'json'
 * 
 * @return {Array}		output[]
 * @return {[Error]}		[0]			Errors. Null means no errors occured.
 * @return {Object}			[1]			File's content (type depends on the option.encoding value. Default is Buffer)
 */
const readFile = (filePath, options) => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to read file '${filePath}'.`)
	if (!filePath)
		throw e('Missing required argument \'filePath\'.')

	const { encoding } = options || {}

	const [errors, content] = await new Promise(onSuccess => fs.readFile(filePath, (err, data) => err ? onSuccess([[err], null]) : onSuccess([null, data])))
	if (errors)
		throw e(errors)

	if (content) {
		if (encoding == 'string')
			return content.toString()
		else if (encoding == 'json') {
			const str = content.toString()
			try {
				return JSON.parse(str)
			} catch (err) {
				throw e('File successfully read as string, but failed to be decoded from string to JSON', err)
			}
		} else // default Buffer
			return content	
	} else
		return content
})())

/**
 * Creates file or update file located under 'filePath'. 
 * 
 * @param  {String}		filePath 			Absolute file path on the local machine
 * @param  {Object}		content 			File content
 * @param  {Object}		options	
 * @param  {Boolean}		.append 		Default false. If true, this function appends rather than overrides.
 * @param  {String}			.appendSep		Default '\n'. That the string used to separate appended content. This option is only
 *								   			active when 'options.append' is set to true.
 * 
 * @return {Array}		output[]
 * @return {[Error]}		[0]			Errors. Null means no errors occured.
 * @return {Void}			[1]		
 */
const writeToFile = (filePath, content, options) => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to write file to '${filePath}'.`)
	if (!filePath)
		throw e('Missing required argument \'filePath\'.')

	content = content || ''
	const { append, appendSep='\n' } = options || {}
	const stringContent = (typeof(content) == 'string' || content instanceof Buffer) ? content : JSON.stringify(content, null, '  ')

	const [errors] = await new Promise(next => fs[append ? 'appendFile' : 'writeFile'](
		filePath,
		append ? `${appendSep}${stringContent}` : stringContent,
		err => err ? next([[err],null]) : next([null,null])
	))

	if (errors)
		throw e(errors)
})())

/**
 * Deletes a file.
 * 
 * @param  {String}		filePath	
 * 
 * @return {Array}		output[]
 * @return {[Error]}		[0]			Errors. Null means no errors occured.
 * @return {Void}			[1]			
 */
const deleteFile = filePath => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to delete file '${filePath}'.`)
	if (!filePath)
		throw e('Missing required argument \'filePath\'.')

	const [errors] = await new Promise(next => fs.unlink(filePath, err => err ? next([[err],null]) : next([null,null])))
	if (errors)
		throw e(errors)
})())

//
// Gets an array of absolute file paths located under the 'folderPath', or a Channel that streams those files.
// 
// @param  {String}				folderPath			Absolute or relative path to folder
// @param  {Object}				options
// @param  {String}					.encoding		Valid values: 'buffer'(default), 'string', 'json'
// @param  {String|[String]}		.pattern		Default is '*.*' which means all immediate files. To get all the files
//													use '**/*.*'. To include the hidden files, use: ['**/*.*', '**/.*/*'].
// @param  {String|[String]}		.ignore			e.g., '**/node_modules/**'
// @param  {Channel}				.channel		When a channel is passed, all files are streamed to that channel instead of 
//													being returned as an array. The last file found add a specific string on 
//													the channel to indicates that the scan is over. That string value is: 'end'.
//											
// @return {Array}				output[]
// @return {[Error]}				[0]				Errors. Null means no errors occured.
// @return {[Object]}				[1]				
// @return {String}						.file		Absolute file path
// @return {Object}						.content	File's content (type depends on the option.encoding value. Default is Buffer)
// 													
const loadContent = (folderPath, options={}) => catchErrors((async () => {
	const e = wrapErrorsFn(`Failed to load the files content under directory '${folderPath}'.`)
	if (!folderPath)
		throw e('Missing required argument \'folderPath\'.')

	const [filesErrors, files] = await listFiles(folderPath, options)
	if (filesErrors)
		throw e(filesErrors)

	let errors = null
	const results = await Promise.all(files.map(async f => {
		const [contentErrors, content] = await readFile(f, options)
		if (contentErrors)
			errors = contentErrors
		return {
			file: f,
			content
		}
	}))

	if (errors)
		throw e(errors)

	return results
})())

module.exports = {
	exists: fileOrFolderExists,
	file: {
		list: listFiles,
		read: readFile,
		write: writeToFile,
		delete: deleteFile
	},
	dir: {
		loadContent
	}
}




