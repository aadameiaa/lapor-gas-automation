const fs = require('fs')
const path = require('path')

const filePath = path.resolve('dist/index.js')
const aliasCode = "#!/usr/bin/env node\nrequire('module-alias/register');"
const fileContent = fs.readFileSync(filePath, 'utf8')

fs.writeFileSync(filePath, aliasCode + fileContent)
