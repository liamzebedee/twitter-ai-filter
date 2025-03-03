# ai-twitter-filter

Browser extension that live filters the timeline's tweets using Artificial General Intelligence.

## Setup.

```sh
# 1. Setup environment.
cp .env.example .env

# 2. Modify .env, add your OPENAI API KEY

# 3. Install deps.
npm i

# 4. Build.
npm run watch:firefox

# 5. Install on Firefox.
# 5a. open about:debugging > This firefox > Load temp addon
# 5b. navigate to the project dist/ folder
# 5c. select the dist/manifest.json file.
# See: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
```

Now load https://x.com, the everything app.

Tweets are sent to GPT-4 and filtered through the prompt in `prompt.js`.

`content.js` dims tweets that don't pass the AI filter.

## Licensing.

Project and contributions are MIT.

### CleansingX.

Forked from CleansingX. 

```
MIT License

Copyright (c) 2024 A Muh Mufqi Zuhudi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```