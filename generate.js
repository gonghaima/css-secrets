// 根据 markdown 文件生成 html 文件以及目录
// 考虑多进程。child_process 模块新建子进程
// 模块重新包装了 child_process，调用系统命令更加方便

// todo
// codedog 作为依赖
// 应该有一个命令是 ./node_modules/bin/xxx 的缩写，记不起来了

const shell = require('shelljs')
const fs = require('fs')
const path = require('path')

function readRootDir() {
  return new Promise(resolve => {
    fs.readdir('./', (err, files) => {
      resolve(files)
    })
  })
}

function getPromiseArr(files) {
  const promiseArr = []

  // 遍历章
  files.forEach(file => {
    // 排除 node_modules 和 .git 两个文件夹的干扰
    if (file === 'node_modules' || file === '.git') return
    let path1 = path.join(__dirname, file)
    let stats = fs.statSync(path1)
    // 排除类似 generate.js package.json 等文件的干扰
    if (!stats.isDirectory()) return 
    
    promiseArr.push(new Promise(resolve => {
      const chapter = {
        chapterName: file,
        sections: []
      }

      fs.readdir(path1, (err, files) => {
        // 遍历节
        files.forEach(file => {
          if (!file.endsWith('.md')) return
          chapter.sections.push(file)

          let path2 = path.join(path1, file)

          // 空格转义
          path2 = path2.replace(/ /g, a => {
            return '\\' + a;
          })

          shell.exec(`codedog ${path2}`)
        })

        resolve(chapter)
      })
    }))
  })

  return promiseArr
}

function generateMarkdown(res) {
  res.sort((a, b) => a.chapterName > b.chapterName)
  
  let markdownStr = ''
  let urlPrefix = `//hanzichi.github.io/css-secrets/`
  markdownStr += `# CSS SECRETS\n\n`

  res.forEach(chapter => {
    let {chapterName, sections} = chapter

    markdownStr += `## ${chapterName}\n\n`
    sections.sort()

    sections.forEach(sectionName => {
      let url = urlPrefix + chapterName + '/' + sectionName.replace('.md', '.html')
      url = encodeURI(url)
      markdownStr += `- [${sectionName.replace('.md', '')}](${url})\n`
    })

    markdownStr += '\n'
  })

  fs.writeFile('README.md', markdownStr, () => {
    console.log('saved!')
  })
}

(async function() {
  const files = await readRootDir()
  const promiseArr = getPromiseArr(files)

  Promise.all(promiseArr).then(res => {
    generateMarkdown(res)
  }).catch((err) => {console.log(err)})
})()