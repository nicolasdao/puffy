# Puffy &middot; [![Tests](https://travis-ci.org/nicolasdao/puffy.svg?branch=master)](https://travis-ci.org/nicolasdao/puffy) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
__*Puffy*__ is a collection of helpers to deal with the most common coding chores (e.g., error handling, retry, math, ...).

```
npm i puffy
```

```js
const { error: { catchErrors, wrapErrors, HttpError }, fetch, url } = require('puffy')

const getWebContent = uri => catchErrors((async () => {
	const { status, data } = await fetch.get({ uri })
	if (status > 300)
		throw new HttpError(`Failed to get content located at ${uri}`, status)
	else
		return data
})())

const getBlogTitle = domain => catchErrors((async () => {
	const websiteUrl = url.buildUrl({
		origin: domain,
		pathname: '//blog.html'
	})

	const [websiteErrors, website] = await getWebContent(websiteUrl)
	if (websiteErrors)
		throw wrapErrors(`Error while loading web page ${websiteUrl}`, websiteErrors)

	const websiteTitle = (website.match(/<title>(.*?)<\/title>/) || [])[1] || ''

	if (!websiteTitle)
		throw new Error(`Web page ${websiteUrl} is missing a required title header`)
	return websiteTitle
})())

const main = async () => {
	const NEAP = 'https://neap.co'
	const GOOGLE = 'https://google.com'
	const [neapErrors, neapBlogTitle] = await getBlogTitle(NEAP)
	const [googleErrors, googleBlogTitle] = await getBlogTitle(GOOGLE)

	if (neapErrors) {
		console.log(`Failed to get the blog title for ${NEAP}`)
		neapErrors.forEach(e => console.log(e.stack))
	} else 
		console.log(`Awesome, the blog title for ${NEAP} is: ${neapBlogTitle}`)
	
	if (googleErrors) {
		console.log(`Failed to get the blog title for ${GOOGLE}`)
		googleErrors.forEach(e => console.log(e.stack))
	} else 
		console.log(`Awesome, the blog title for ${GOOGLE} is: ${googleBlogTitle}`)
}

main()
```

# License
Copyright (c) 2020, Cloudless Consulting Pty Ltd.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Neap Pty Ltd nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL NEAP PTY LTD BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

