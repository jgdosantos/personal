import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PropostaMarcelo from './proposta/PropostaMarcelo.jsx'
import BriefForm from './brief/BriefForm.jsx'
import DecisoesLigia from './decisoes/DecisoesLigia.jsx'
import './index.css'

// Roteamento por path. O vercel.json reescreve tudo para o index, então o
// pathname chega intacto aqui e basta escolher a página — sem router extra.
//
// /perguntas-ligia saiu daqui de propósito: o briefing já foi respondido e a
// rota está fora do ar. Os componentes, a API, os testes e os docs dela
// continuam no repositório — é só a rota que sumiu, e voltar é acrescentar uma
// linha aqui de novo.
const routes = {
  '/proposta-marcelo': PropostaMarcelo,
  '/brief': BriefForm,
  '/decisoes-ligia': DecisoesLigia,
}

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = routes[path] || App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)
