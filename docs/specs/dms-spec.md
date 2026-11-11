# Especificação - Document Management System

> Especificação derivada de [spec-template.md](./spec-template.md), no modelo
> Spec Driven Development. Este documento define o que será construído e a
> ordem de execução. Não contém código de backend nem de frontend.

## 1. Objetivo

Oferecer uma aplicação web simples para enviar, listar e baixar documentos,
com metadados associados a um usuário, armazenando os arquivos apenas no
filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada documento tem um dono)
- Endpoint de saúde já existente (`GET /health`)

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, GCS, Azure Blob etc.)
- Serviços de upload de terceiros
- Versionamento de documentos
- Autenticação e autorização (senhas, tokens, sessões)
- Banco de dados persistente (metadados ficam em memória nesta fase)
- Exclusão, edição ou compartilhamento de documentos
- Pré-visualização de conteúdo e OCR

## 3. Requisitos funcionais

| ID    | Requisito                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento (arquivo único por requisição) via formulário multipart                 |
| RF-02 | O sistema associa o documento ao dono informado no cabeçalho `X-User-Id`                                   |
| RF-03 | O sistema rejeita uploads sem arquivo, com tipo não permitido ou acima do tamanho máximo                    |
| RF-04 | O usuário pode listar os documentos de um dono (`X-User-Id`), ordenados do mais recente para o mais antigo |
| RF-05 | O usuário pode baixar um documento pelo seu identificador, recebendo o conteúdo original                   |
| RF-06 | O download de um identificador inexistente retorna 404                                                     |
| RF-07 | A interface web permite enviar um documento, ver a lista e baixar um item                                  |
| RF-08 | A interface exibe mensagens de erro e de sucesso ao usuário em português                                   |

### Regras de negócio

- **RN-01:** o `X-User-Id` é obrigatório em `POST /upload` e em `GET /documents`.
  Ausência ou valor vazio retorna 400.
- **RN-02:** `GET /documents` retorna somente documentos cujo `owner` é igual ao
  `X-User-Id` informado.
- **RN-03:** `GET /documents/:id/download` não verifica dono nesta fase. Qualquer
  cliente que conheça o `id` pode baixar. Esta limitação é aceita e registrada
  na seção 7.
- **RN-04:** tipos aceitos: `pdf`, `png`, `jpg`, `docx`, `txt`. A verificação usa
  a extensão e o MIME type informado pelo cliente.
- **RN-05:** tamanho máximo padrão de 10 MB, configurável por `MAX_UPLOAD_SIZE_MB`.
- **RN-06:** o nome original é preservado apenas como metadado. O nome gravado no
  disco é gerado pelo servidor, sem usar o nome enviado pelo cliente.

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local via `multer` com `diskStorage`, na pasta `backend/storage`              |
| RNF-02 | Metadados mantidos em memória nesta fase (perdidos ao reiniciar o processo)                                   |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor): `PORT`, `STORAGE_DIR`, `MAX_UPLOAD_SIZE_MB`               |
| RNF-04 | Backend em Node.js + Express em CommonJS; frontend em React + Vite em ESM; JavaScript puro, sem TypeScript   |
| RNF-05 | Testes do backend com o runner nativo `node:test`, sem dependências novas                                     |
| RNF-06 | Erros de entrada HTTP e de leitura/escrita de arquivos são tratados nos limites do sistema                    |
| RNF-07 | Nomes de símbolos em inglês; mensagens ao usuário e comentários em português                                  |
| RNF-08 | Código segue SOLID, DRY, KISS e YAGNI, sem abstrações além do necessário                                      |

## 5. Modelo de dados (metadados do documento)

Metadados ficam em um `Map` em memória, indexado por `id`.

| Campo        | Tipo   | Descrição                                                              |
| ------------ | ------ | ---------------------------------------------------------------------- |
| id           | string | Identificador único (UUID v4 gerado pelo servidor)                     |
| originalName | string | Nome original do arquivo enviado                                       |
| storedName   | string | Nome do arquivo gravado em `STORAGE_DIR` (uso interno, não exposto)    |
| mimeType     | string | MIME type informado no upload                                          |
| size         | number | Tamanho em bytes                                                       |
| uploadedAt   | string | Data/hora do upload em ISO 8601 (UTC)                                  |
| owner        | string | Valor do cabeçalho `X-User-Id` no momento do upload                    |

Ao serializar a resposta, o campo `storedName` é omitido.

Exemplo:

```json
{
  "id": "3f1c2a7e-8d4b-4e7a-9b1e-2c5d6f7a8b90",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 204800,
  "uploadedAt": "2026-11-11T12:00:00.000Z",
  "owner": "usuario-01"
}
```

## 6. Contratos de API

Base: `http://<host>:<PORT>`. No frontend, as chamadas usam o prefixo `/api`,
que o Vite encaminha para o backend.

### Formato de erro

Todas as respostas de erro usam JSON com a forma:

```json
{ "error": "mensagem em português" }
```

### GET /health

- Saída `200`: `{ "status": "ok" }` (já implementado).

### POST /upload

- Cabeçalhos: `X-User-Id` (obrigatório), `Content-Type: multipart/form-data`
- Corpo: campo `file` com o arquivo
- Saída `201`: metadados do documento criado (seção 5, sem `storedName`)
- Erros:
  - `400`: `X-User-Id` ausente ou campo `file` ausente
  - `413`: arquivo acima de `MAX_UPLOAD_SIZE_MB`
  - `415`: tipo de arquivo não permitido
  - `500`: falha ao gravar o arquivo

### GET /documents

- Cabeçalhos: `X-User-Id` (obrigatório)
- Saída `200`: array com os metadados dos documentos do dono, do mais recente
  para o mais antigo. Lista vazia é resposta válida.
- Erros:
  - `400`: `X-User-Id` ausente

### GET /documents/:id/download

- Parâmetros: `id` (string)
- Saída `200`: conteúdo binário do arquivo, com
  `Content-Type` igual ao `mimeType` salvo e
  `Content-Disposition: attachment; filename="<originalName>"`
- Erros:
  - `404`: `id` inexistente ou arquivo ausente no disco
  - `500`: falha ao ler o arquivo

### Exemplos de requisição

```bash
curl -H "X-User-Id: usuario-01" -F "file=@contrato.pdf" http://localhost:3000/upload
curl -H "X-User-Id: usuario-01" http://localhost:3000/documents
curl -OJ http://localhost:3000/documents/<id>/download
```

## 7. Decisões arquiteturais

### Backend (Clean Architecture simples)

Dentro de `backend/src`, o fluxo de dependência é
`routes -> controllers -> services -> repositories`. Camadas internas não
conhecem as externas.

| Camada         | Responsabilidade                                                         |
| -------------- | ------------------------------------------------------------------------ |
| `routes/`      | Definem endpoints e delegam aos controllers                              |
| `controllers/` | Tratam entrada e saída HTTP, validação básica e mapeamento de erros      |
| `services/`    | Regras de negócio: tipos permitidos, limite, geração de id, filtro por dono |
| `repositories/`| Persistência: gravação de arquivos em disco e metadados em memória       |

- `multer` (com `diskStorage`) fica na camada de repositório de arquivos ou
  como middleware de rota. Em ambos os casos, o service não depende do
  `multer`.
- Erros de domínio são classes ou códigos simples que o controller converte em
  HTTP.

### Frontend

- React com Vite, em ESM.
- Componentes funcionais com Hooks.
- Organização: `components/` (elementos reutilizáveis), `pages/` (tela de
  documentos), `services/` (chamadas `fetch` a `/api`).
- O identificador do usuário fica em um campo simples da interface e é enviado
  no cabeçalho `X-User-Id`.

### Decisões assumidas e riscos

- **Sem autenticação:** `X-User-Id` é informado pelo cliente e não é validado.
  Qualquer cliente pode se passar por outro usuário. Aceito nesta fase.
- **Download sem checagem de dono (RN-03):** o `id` é um UUID não sequencial,
  o que reduz o risco, mas não o elimina. Deve ser corrigido quando houver
  autenticação.
- **Metadados em memória (RNF-02):** reiniciar o processo faz os metadados
  sumirem, embora os arquivos continuem em disco. Um serviço de limpeza ou
  reconstrução fica fora do escopo.
- **Armazenamento local apenas:** nenhum provedor externo é usado.

## 8. Plano de execução

Etapas na ordem de implementação. Cada etapa só começa após a anterior ser
validada.

1. **Configuração**
   - Ler `PORT`, `STORAGE_DIR` (padrão `backend/storage`) e `MAX_UPLOAD_SIZE_MB`
     (padrão `10`) em um módulo de configuração.
   - Garantir que o diretório de armazenamento exista na inicialização.
   - Validação: `GET /health` continua respondendo `200`.

2. **Repositórios (backend)**
   - Repositório de metadados em memória (`Map`) com operações de salvar,
     buscar por id e listar por dono.
   - Repositório de arquivos com `multer` `diskStorage`, nome gerado pelo
     servidor e limite de tamanho.
   - Validação: testes unitários com `node:test`.

3. **Services (backend)**
   - Serviço de documentos: validar tipo, montar metadados com UUID e data ISO,
     listar por dono em ordem decrescente e resolver o download.
   - Validação: testes unitários cobrindo RN-01 a RN-06.

4. **Controllers e rotas (backend)**
   - Rotas `POST /upload`, `GET /documents` e `GET /documents/:id/download`.
   - Controllers que mapeiam erros para `400`, `404`, `413`, `415` e `500`.
   - Registrar as rotas no `app.js` sem alterar `/health`.
   - Validação: testes de integração com `supertest` ou `fetch` contra o app
     exportado, cobrindo os contratos da seção 6.

5. **Frontend**
   - Configurar o proxy `/api` no Vite, se ainda não estiver configurado.
   - Services com `fetch` para upload, listagem e download.
   - Componentes de formulário de upload e de tabela de documentos, usados na
     página principal.
   - Mensagens de sucesso e erro em português.
   - Validação: fluxo manual de enviar, listar e baixar.

6. **Documentação e fechamento**
   - Atualizar o `README.md` com as variáveis de ambiente e os comandos de
     execução.
   - Revisar a aderência aos requisitos RF-01 a RF-08 e RNF-01 a RNF-08.

## 9. Critérios de aceitação

- Todos os endpoints da seção 6 respondem conforme o contrato, incluindo erros.
- Arquivos aparecem em `backend/storage` com nomes gerados pelo servidor.
- A listagem respeita o dono informado em `X-User-Id`.
- Os testes do backend passam com `node --test`.
- A interface permite enviar, listar e baixar um documento.
