import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PropostaMarcelo from './proposta/PropostaMarcelo.jsx'
import './index.css'

// Roteamento por path. O vercel.json reescreve tudo para o index, então o
// pathname chega intacto aqui e basta escolher a página — sem router extra.
const routes = {
  '/proposta-marcelo': PropostaMarcelo,
}

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = routes[path] || App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)
