# EcoFlow Web - Painel Administrativo

Painel de controle para síndicos e administradores do sistema EcoFlow.

## 📝 Descrição

O **EcoFlow Web** é a interface administrativa onde o síndico gerencia todo o ecossistema de sustentabilidade do condomínio. Através deste painel, é possível acompanhar métricas de descarte, validar registros de moradores, gerenciar o catálogo de recompensas e visualizar o ranking de engajamento.

---

## 🚀 Tecnologias

- **Framework:** [Vue 3](https://vuejs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript
- **Estilização:** CSS Vanilla / Tailwind (conforme aplicável)
- **Gráficos:** [Chart.js](https://www.chartjs.org/) com [vue-chartjs](https://vue-chartjs.org/)
- **Ícones:** [Lucide Vue](https://lucide.dev/guide/packages/lucide-vue-next)
- **Consumo de API:** [Axios](https://axios-http.com/)

---

## 🛠️ Funcionalidades

### 📈 Dashboard de Métricas
- Visualização de total de resíduos coletados (kg).
- Gráficos de evolução mensal e comparativo de metas.
- Status de engajamento global do condomínio.

### 👥 Gestão de Moradores e Unidades
- Cadastro e listagem de moradores.
- Visualização de pontuação e nível de cada residente.
- Filtros por bloco e número do apartamento.

### ♻️ Controle de Descartes
- Lista de descartes pendentes de aprovação.
- Visualização de fotos enviadas pelos moradores para conferência.
- Ferramenta para aprovar/negar descartes e atribuir pontos.

### 🎁 Centro de Recompensas
- Gestão completa do catálogo de prêmios.
- Controle de estoque e validade de benefícios.
- Validação de cupons resgatados pelos moradores.

---

## ⚙️ Configuração

### Pré-requisitos
- Node.js (v20+)

### Instalação
1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente em um arquivo `.env`:
```env
VITE_API_URL="http://localhost:3000/api"
```

### Execução
```bash
# Servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build localmente
npm run preview
```

---

## 📂 Estrutura de Pastas

- `src/views`: Páginas principais da aplicação.
- `src/components`: Componentes reutilizáveis.
- `src/services`: Camada de comunicação com a API.
- `src/assets`: Arquivos estáticos (imagens, estilos globais).

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
