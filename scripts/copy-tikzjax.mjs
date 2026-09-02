import { cpSync, rmSync, mkdirSync, existsSync } from "fs"

const src = "node_modules/@rod2ik/tikzjax/dist"
const dest = "public/vendor/tikzjax"

if (!existsSync(src)) {
  console.log("TikZJax dist não encontrado, pule cópia")
  process.exit(0)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
console.log("TikZJax assets copiados para", dest)
