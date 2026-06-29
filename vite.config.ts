import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { resolve } from 'path'
import https from 'https'
import http from 'http'
import { vitePluginHaibao } from './src/plugins/haibao/vitePluginHaibao'

// 图片代理插件（解决 CORS）
function imageProxyPlugin() {
    return {
        name: 'image-proxy',
        configureServer(server) {
            server.middlewares.use('/api/proxy-image', (req, res) => {
                const url = new URL(req.url || '', 'http://localhost')
                const targetUrl = url.searchParams.get('url')
                if (!targetUrl) {
                    res.writeHead(400)
                    res.end('Missing url parameter')
                    return
                }
                // 校验 URL：只允许 http/https，禁止内网地址
                let parsed
                try {
                    parsed = new URL(targetUrl)
                } catch {
                    res.writeHead(400)
                    res.end('Invalid url')
                    return
                }
                if (!['http:', 'https:'].includes(parsed.protocol)) {
                    res.writeHead(403)
                    res.end('Only http/https allowed')
                    return
                }
                const hostname = parsed.hostname
                if (
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname === '::1' ||
                    hostname.startsWith('192.168.') ||
                    hostname.startsWith('10.') ||
                    hostname.startsWith('172.') ||
                    hostname === '169.254.169.254' ||
                    hostname === '0.0.0.0'
                ) {
                    res.writeHead(403)
                    res.end('Internal addresses not allowed')
                    return
                }
                const client = targetUrl.startsWith('https') ? https : http
                client.get(targetUrl, (proxyRes) => {
                    res.writeHead(proxyRes.statusCode || 200, {
                        'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                        'Access-Control-Allow-Origin': '*',
                    })
                    proxyRes.pipe(res)
                }).on('error', (err) => {
                    res.writeHead(500)
                    res.end(err.message)
                })
            })
        },
    }
}

// https://vitejs.dev/config/
const config=({mode})=>{
    return{
        plugins: [
            imageProxyPlugin(),
            vitePluginHaibao(),
            vue(),
            // 自动按需引入组件
            AutoImport({
                resolvers: [
                    ArcoResolver({
                        // importStyle: 'less',
                    }),
                ],
                imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
                eslintrc: {
                    enabled: true,
                },
            }),
            Components({
                directoryAsNamespace: true,
                resolvers: [
                    // 自动引入arco
                    ArcoResolver({
                        // importStyle: 'less',
                        resolveIcons: true,
                    }),
                ],
            }),
            UnoCSS(),
            createSvgIconsPlugin({
                // 指定需要缓存的图标文件夹
                iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
                // 指定symbolId格式
                symbolId: 'icon-[dir]-[name]',
            }),
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        // 依赖预构建 — 加速启动
        optimizeDeps: {
            include: [
                'vue',
                'vue-router',
                'pinia',
                '@vueuse/core',
                'axios',
                'lodash',
                'mousetrap',
                'tinycolor2',
                'fontfaceobserver',
                'number-precision',
                'uuid',
                'ag-psd',
                'jspdf',
                'jszip',
                'xlsx',
                'qrcode',
                'jsbarcode',
                'tinymce/tinymce',
                '@tinymce/tinymce-vue',
                'leafer-ui',
                '@leafer-in/editor',
                '@leafer-in/flow',
                '@leafer-in/arrow',
                '@leafer-in/export',
                '@leafer-in/find',
                '@leafer-in/html',
                '@leafer-in/resize',
                '@leafer-in/scroll',
                '@leafer-in/state',
                '@leafer-in/text-editor',
                '@leafer-in/view',
                '@leafer-in/viewport',
            ],
            exclude: [
                '@imgly/background-removal', // 按需加载，不预构建
            ],
        },
        server: {
            proxy: {
                '/mimo-api': {
                    target: 'https://token-plan-cn.xiaomimimo.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/mimo-api/, ''),
                },
                '/dashscope-api': {
                    target: 'https://dashscope.aliyuncs.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/dashscope-api/, ''),
                },
            },
        },
    }
}
export default defineConfig(config)
