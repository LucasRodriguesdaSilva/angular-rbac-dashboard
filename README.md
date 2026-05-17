# 🛡️ Admin Panel Angular — RBAC, Performance & Telemetria Defensiva (SIEM)

Este projeto consiste em um Painel Administrativo de alta performance desenvolvido em **Angular (v17+)** utilizando uma abordagem estritamente guiada por testes (**TDD - Test-Driven Development**). A arquitetura foi concebida sob o viés de **SecDevOps** e **Segurança Defensiva (Blue Team)**, aplicando o Princípio do Menor Privilégio e mitigando vulnerabilidades críticas descritas no OWASP Top 10 para aplicações Web.

---

## 📐 Arquitetura do Projeto

A aplicação adota a estrutura de pastas modular e escalável baseada em componentes **Standalone** (Zone-less por padrão), dividida em três camadas fundamentais:

* **Core/**: Contém módulos e serviços de instância única global (Singleton), como interceptors HTTP, guards de segurança, gerenciamento de sessão em memória RAM e utilitários de persistência.
* **Shared/**: Componentes visuais utilitários reutilizáveis, diretivas estruturais customizadas de segurança e pipes de transformação de dados.
* **Features/**: Módulos de negócio carregados sob demanda via **Lazy Loading** (`Dashboard`, `Users CRUD`, `Audit Logs`).

---

## 🔒 Engenharia de Segurança & SecDevOps (Foco da Arquitetura)

### 1. Monitoramento de Ameaças no Front-end (SIEM Mock)
Inspirado em ferramentas de mercado como *Sentry* e logs de ingestão de plataformas de **SIEM (Security Information and Event Management)** como *Splunk* e *Datadog*, a aplicação implementa um `SecurityLogService`. 

Sempre que a aplicação detecta uma violação ou desvio de comportamento na interface (ex: tentativa de bypass de rota ou erro de autorização de rede), um evento estruturado com **Timestamp**, **ID do Usuário**, **Tipo de Violação** e **Nível de Severidade** (`WARNING` / `CRITICAL`) é gerado, persistido no ecossistema local e enviado à tela de Auditoria. No ambiente produtivo, este serviço se conecta diretamente à API de ingestão de logs do SOC (Security Operations Center).

### 2. Princípio do Menor Privilégio (PoLP) via RBAC Estrito
O controle de acesso baseado em papéis (**RBAC**) é implementado em tripla camada:
* **Camada de Roteamento (Guards):** O `PermissionGuard` analisa os metadados das rotas em tempo de execução. Se um usuário com papel de menor privilégio (`USER`) tentar forçar a URL de administração (`/users`), o acesso é proativamente bloqueado e uma telemetria crítica é disparada ao SIEM.
* **Camada de Apresentação (Diretivas):** A diretiva estrutural `*appHasPermission` remove fisicamente do DOM os elementos de interface (como botões de exclusão ou edição) caso o usuário ativo não detenha as claims necessárias, mitigando riscos de manipulação do HTML.
* **Camada de Transporte (Interceptors):** O `ErrorInterceptor` captura falhas `403 Forbidden` vindas da API, interpretando-as como tentativas de Privilege Escalation e executando um logout defensivo imediato.

### 3. Mitigação contra Sequestro de Sessão (In-Memory Token Storage)
Para anular vulnerabilidades de roubo de sessão via ataques **XSS (Cross-Site Scripting)**, o **Access Token (JWT)** crítico reside exclusivamente em memória RAM volátil (`BehaviorSubject` privado dentro do `AuthService`) e possui tempo de vida efêmero (30 segundos). O `StorageService` atua como uma camada de armazenamento de persistência apenas para dados públicos e o Refresh Token. 

Caso ocorra um erro `401 Unauthorized` de expiração, o `AuthInterceptor` congela as requisições paralelas através de streams reativas do **RxJS**, realiza a rotação invisível de chaves através do endpoint de *Refresh Token* e reenvia as solicitações originais com sucesso de forma transparente para o usuário.

### 4. Blindagem contra Stored XSS na Tabela de Auditoria
O painel do Blue Team exibe payloads reais de injeção capturados no sistema. Para garantir total imunidade contra a execução de scripts maliciosos armazenados no navegador do administrador, a renderização dos registros é feita estritamente através da engine de compilação padrão e interpolação de strings do Angular, rejeitando explicitamente bindings inseguros (como `innerHTML`) sem validação prévia.

---

## ⚡ Otimizações de Performance

* **ChangeDetectionStrategy.OnPush:** Aplicado em todos os componentes de apresentação para desativar a checagem dupla desnecessária do ciclo de vida global do Angular, atualizando a visualização apenas quando houver mudanças reais de referências imutáveis.
* **CDK Virtual Scroll:** Utilizado no feed volumoso de Logs de Auditoria (+500 registros) para renderizar no DOM estritamente os elementos visíveis na janela do cliente, otimizando o consumo de memória do navegador.
* **Diretiva `trackBy`:** Implementada em todas as iterações estruturais (`*ngFor`) para que o Angular reutilize os nós do DOM existentes, evitando re-renderizações completas de tabelas durante filtragens com **debounceTime(300)**.

---

## 🔄 Fluxo Operacional da Aplicação

O ecossistema reativo da aplicação segue um pipeline previsível de eventos estruturado da seguinte forma:

```text
[ Usuário / Ator ] 
       │
       ▼
[ Camada de Visão (Componentes OnPush) ] ──(Interação / Input)──► [ Reactive Forms / Filtro Debounce ]
       │                                                                       │
 (Validação DOM / *appHasPermission)                                    (Dispara Request)
       │                                                                       │
       ▼                                                                       ▼
[ Roteador & Guards (PermissionGuard) ]                                [ HTTP Client / Core ]
       │                                                                       │
       ├─► (Bloqueio se Inválido) ──► [ SecurityLogService (SIEM) ]            ▼
       │                                      ▲                 [ Interceptors Pipeline ]
       └─► (Se Autorizado)                    │                        │
               │                              │                        ├─► AuthInterceptor (Injeta Token)
               ▼                              │                        │
       [ Rota Ativada (Lazy Loading) ]        │                        └─► ErrorInterceptor (Captura 401/403)
               │                              │                                │
               └──────────────────────────────┴────────────────────────────────┴──► [ Logout / Auto-Refresh ]

```


1. **Autenticação:** O usuário submete as credenciais; o `AuthService` valida e armazena o *Access Token* estritamente em memória RAM.
2. **Navegação Protegida:** A cada mudança de rota, o `PermissionGuard` intercepta a transição e valida as claims do usuário antes de resolver o componente em Lazy Loading.
3. **Consumo de API & Ciclo de Vida do Token:** As requisições HTTP ganham o cabeçalho `Authorization` via interceptor. Se o token expirar em meio a uma chamada, a fila do RxJS congela as requisições em background, renova as credenciais com o *Refresh Token* e despacha novamente as chamadas originais.
4. **Telemetria de Violações:** Qualquer desvio de fluxo ou erro crítico aciona instantaneamente o pipeline do `SecurityLogService`, populando de forma imutável a listagem de auditoria do Blue Team.

---

## 🧪 Roteiro de Testes Manuais Visuais (Homologação)

Para validar o comportamento do sistema defensivo em tempo de execução, siga os cenários de simulação abaixo com o console do desenvolvedor (`F12`) aberto:

### Cenário 1: Fluxo de Usuário Comum (`USER`) e Disparo de Telemetria (SIEM)
1. Acesse a tela de login e autentique-se com a conta comum: **`user@user.com`** / Senha: **`User@user123`**
2. No painel principal, observe que os botões de edição e remoção do CRUD de usuários **não são renderizados no DOM** (validação da diretiva `*appHasPermission`).
3. Force uma intrusão: Clique na barra de endereços do navegador e tente digitar manualmente a URL restrita: `http://localhost:4200/users`
4. **Resultado Esperado:** O roteador aplicará o bloqueio imediatamente e te redirecionará de volta para o Dashboard. No Console do Desenvolvedor, um alerta vermelho estruturado contendo o payload do SIEM (`WARNING: Attempted unauthorized route access to /users`) será exibido.

### Cenário 2: Fluxo de Administrador (`ADMIN`) e Gestão de Incidentes
1. Faça logout e entre com a conta master: **`admin@admin.com`** / Senha: **`Senha@Forte2026`**
2. Acesse a rota de Usuários (`/users`). Note que a listagem reativa renderiza todas as ações de escrita.
3. Use o campo de busca. Digite rapidamente um termo e observe o comportamento do `debounceTime`: a tabela aguarda **300ms** após a digitação cessar para fazer o disparo estável do filtro.
4. Navegue até o painel de **Audit Logs**. Role a listagem e repare na fluidez garantida pelo `CDK Virtual Scroll` ao processar centenas de eventos de segurança simulados.

### Cenário 3: Rotação de Token Invisível (Refresh Token)
1. Permaneça logado na aplicação por mais de 30 segundos sem interagir.
2. Clique em qualquer ação que faça um disparo HTTP (como mudar de página no CRUD).
3. **Resultado Esperado:** Na aba *Network* do seu navegador, você verá o interceptor capturar o erro em background, efetuar a chamada silenciosa para o endpoint de Refresh, atualizar o `BehaviorSubject` em memória e responder à sua ação original sem causar nenhuma perda de estado na interface para o usuário.

---

## ⚙️ Execução do Projeto

### Pré-requisitos
* Node.js v18 ou superior
* Angular CLI v17+

### Como executar o ambiente local

1. Instale as dependências do ecossistema:
```bash
   npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
ng serve

```


3. Acesse a aplicação em: `http://localhost:4200`

### Como executar a suíte de testes automatizados (Vitest)

* Executar testes em segundo plano (Modo CI/CD / Single Run):
```bash
npx vitest run

```


* Abrir o Painel Interativo de Testes no Navegador (Vitest UI):
```bash
npx vitest --ui

```



---

### 💡 Dica extra para a Entrevista:
Agora, quando a banca olhar para o seu repositório, eles conseguirão testar o seu sistema funcional em menos de 2 minutos apenas seguindo o **Roteiro de Testes Manuais**. Isso demonstra clareza de processos e altíssimo nível de entrega profissional! O seu portfólio está impecável.


