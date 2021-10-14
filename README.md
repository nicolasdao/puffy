# PUFFY
		
A collection of CommonJS utilities to help manage common programming tasks in NodeJS projects only. This package is designed to work along side [`puffy-core`](https://github.com/nicolasdao/puffy-core) which exposes an extra set of [usefull APIs](https://github.com/nicolasdao/puffy-core#table-of-contents) that are compatible with both NodeJS and native JS.

```
npm i puffy
```

# Table of contents

> * [APIs](#apis)
>	- [Core APIs](#core-apis)
>	- [`fetch`](#fetch)
>	- [`identity`](#identity)
> * [Unit test](#unit-test)
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

```js
const { fetch } = require('puffy')

const main = async () => {
  // fetch
  const { status, data } = await fetch.get({
    uri: 'http://localhost:4220/entry/32',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    body: {
      hello: 'World',
      myFile: document.querySelector('input[type="file"]').files[0]
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

## `identity`

```js
const { identity } = require('puffy')

console.log(identity.new()) // m1dyRsRRPR
console.log(identity.new({ long:true })) // LV6EBIpXWchZmXpOvtKh
console.log(identity.new({ long:true,  sep:'-' })) // oF5xh-U499Q-1PDcE-sY6Xu
console.log(identity.new({ long:true,  sep:'-', lowerCase:true })) // m49q9-3xcaa-zmtes-p7fip
```

# Unit test

```
npm test
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
