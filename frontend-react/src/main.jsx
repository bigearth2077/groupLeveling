import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import './i18n' // 引入 i18n 配置
import './index.css' // 引入 Tailwind 样式
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster richColors position="top-center" closeButton />
    <RouterProvider router={router} />
  </React.StrictMode>,
)
