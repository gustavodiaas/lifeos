# LifeOS

[English](README.md)

LifeOS é um sistema pessoal open source que reúne metas, projetos, tarefas, hábitos, agenda, notas, diário e finanças em um único espaço.

> [!IMPORTANT]
> O LifeOS está em estágio inicial e passa por uma reorganização. Alguns módulos usam Supabase, enquanto outros ainda armazenam dados apenas no navegador. Consulte a [arquitetura atual](docs/ARCHITECTURE.md) antes de utilizar o sistema com dados importantes ou sensíveis.

## Por que o LifeOS?

A maioria das ferramentas de produtividade separa planejamento, execução e reflexão em aplicativos diferentes. O LifeOS está evoluindo para oferecer um fluxo único:

**Metas → projetos → tarefas → agenda → execução diária → revisão semanal**

Hábitos, notas, diário, métricas pessoais e finanças devem complementar esse fluxo, em vez de funcionarem como painéis isolados.

## Recursos atuais

- Painel pessoal e ações de captura rápida
- Projetos e tarefas com prioridade, status, etiquetas e checklists
- Metas e acompanhamento de progresso
- Hábitos e sequências
- Agenda e lembretes
- Notas, pastas, backlinks, ferramentas de estudo e livros
- Diário e histórico de humor
- Métricas pessoais e estatísticas
- Controle de receitas e despesas
- Listas de compras e objetivos de economia
- Autenticação e módulos sincronizados pelo Supabase
- Aplicação progressiva instalável (PWA)
- Temas claro, escuro e conforme o sistema

## Tecnologias

- React 19 e TypeScript
- TanStack Start, Router e Query
- Vite 8
- Tailwind CSS 4 e Radix UI
- Supabase Auth, Database, Storage e Realtime
- React Hook Form e Zod
- Recharts
- Vite PWA

## Demonstração

A versão pública atual está em [lifeos-omega-three.vercel.app](https://lifeos-omega-three.vercel.app/). É necessário criar uma conta para acessar o aplicativo.

## Executando localmente

### Requisitos

- [Bun](https://bun.sh/) — o arquivo de dependências do projeto é mantido com Bun
- Um projeto no Supabase

### Instalação

```bash
git clone https://github.com/gustavodiaas/lifeos.git
cd lifeos
bun install
cp .env.example .env.local
```

No Windows PowerShell, substitua o último comando por:

```powershell
Copy-Item .env.example .env.local
```

Preencha as variáveis com os dados do seu projeto Supabase e inicie o ambiente:

```bash
bun run dev
```

O terminal mostrará o endereço local.

## Variáveis de ambiente

| Variável                 | Finalidade                                               |
| ------------------------ | -------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL pública do projeto Supabase                          |
| `VITE_SUPABASE_ANON_KEY` | Chave pública legada utilizada atualmente pela aplicação |

Nunca coloque uma chave `service_role` ou secreta do Supabase em uma variável `VITE_`. Variáveis do navegador são incorporadas ao aplicativo. A migração para a nomenclatura atual de chaves publicáveis do Supabase está registrada no roadmap.

## Comandos disponíveis

| Comando             | Descrição                                  |
| ------------------- | ------------------------------------------ |
| `bun run dev`       | Inicia o ambiente de desenvolvimento       |
| `bun run build`     | Gera a versão de produção                  |
| `bun run build:dev` | Gera uma versão em modo de desenvolvimento |
| `bun run preview`   | Visualiza a versão de produção             |
| `bun run lint`      | Executa o ESLint                           |
| `bun run format`    | Formata o repositório com Prettier         |

## Estrutura do projeto

```text
src/
├── components/     Componentes compartilhados da aplicação e da interface
├── context/        Estado de autenticação e espaços de trabalho
├── hooks/          Acesso a dados e estado dos módulos
├── lib/            Utilitários, tipos, exportações e cliente Supabase
├── modules/        Módulos do produto
├── pwa/            Registro do service worker
└── routes/         Rotas baseadas em arquivos do TanStack
```

Consulte [Arquitetura](docs/ARCHITECTURE.md) para conhecer os limites atuais dos dados e as restrições já identificadas.

## Roadmap

As prioridades atuais são:

1. Fundação do repositório, modelo de dados e segurança
2. Sistema visual consistente e pensado primeiro para dispositivos móveis
3. Central diária clara e objetiva
4. Integração entre metas, projetos, tarefas, agenda e hábitos
5. Planejamento e revisão semanal guiados
6. Assistência de IA opcional e consciente da privacidade

A sequência detalhada está disponível no [Roadmap](docs/ROADMAP.md).

## Como contribuir

Contribuições e sugestões fundamentadas são bem-vindas. Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um pull request. Utilize as Issues do GitHub para erros reproduzíveis e propostas objetivas.

Para vulnerabilidades ou problemas de privacidade, siga [SECURITY.md](SECURITY.md) e não abra uma issue pública.

## Licença

LifeOS é disponibilizado sob a [Licença MIT](LICENSE).
