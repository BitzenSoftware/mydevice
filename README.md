# Device Mockup

Digite a URL de um site e veja-o rodando **de verdade** dentro de uma moldura de
celular, tablet ou desktop — navegável, com a cor da moldura à sua escolha e com
download do mockup em PNG de fundo transparente.

O site não é embutido num `<iframe>`: ele é aberto num Chrome headless no
servidor, com a emulação real do aparelho (user-agent mobile, toque e viewport).
Por isso PWAs reconhecem corretamente que estão num celular, e funciona mesmo em
sites que bloqueiam incorporação.

## Rodando localmente

```bash
npm install
npm start
```

Abra <http://localhost:5177>. Usa o Chrome ou Edge já instalado na máquina.

Localmente é permitido apontar para `localhost` — dá para ver o seu próprio
projeto em desenvolvimento dentro de uma moldura.

## Publicando

Precisa de um **processo Node persistente com WebSocket** e um Chromium ao lado.
Plataformas serverless (Vercel, Netlify Functions, Cloudflare Workers) **não
servem**: a sessão ao vivo depende de conexão contínua e de um navegador vivo
entre as requisições.

O `Dockerfile` já traz o Chromium e as fontes necessárias.

### Render

Há um `render.yaml` pronto. No painel: **New → Blueprint**, aponte para o
repositório e confirme. Ou crie um **Web Service** com runtime *Docker*.

### Railway

**New Project → Deploy from GitHub repo**. O Dockerfile é detectado
automaticamente. Em *Settings → Networking*, gere o domínio público.

### Fly.io

```bash
fly launch --dockerfile Dockerfile
fly deploy
```

### Ajustes

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `PORT` | `5177` | Porta HTTP (as plataformas definem sozinhas) |
| `MAX_SESSIONS` | `6` | Sessões simultâneas. Cada uma é uma aba de Chrome viva — subir demais estoura a memória |
| `ALLOW_PRIVATE_HOSTS` | `0` em produção | Deixa abrir endereços internos. **Mantenha desligado** em servidor público |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` | Caminho do navegador |

Reserve pelo menos **1 GB de RAM**: Chromium com várias abas não cabe nos planos
gratuitos mais apertados. Comece com `MAX_SESSIONS=2` se a memória for pouca.

`GET /health` responde `{"ok":true}` para o health check da plataforma.

## Segurança

Como o servidor abre qualquer URL que o visitante digitar, num servidor público
ele poderia ser usado para alcançar coisas que só a máquina enxerga. Por isso:

- endereços de loopback, redes privadas, link-local e CGNAT são recusados;
- o endpoint de metadados da nuvem (`169.254.169.254`) é bloqueado no próprio
  resolvedor do navegador, então nem um redirecionamento chega até ele;
- há teto de sessões simultâneas.

Ainda assim, o app deixa qualquer visitante navegar pela internet a partir do IP
do seu servidor. Se for expor publicamente, considere colocar autenticação na
frente.

## Como funciona a transmissão

Nenhum método de captura sozinho resolve, então ela é híbrida:

- `Page.startScreencast` é rápido (~23 fps) mas o Chrome headless ignora o
  `deviceScaleFactor` e sempre entrega 1x — borrado numa tela HiDPI;
- `page.screenshot` respeita a densidade de pixels (nítido) mas leva ~105 ms por
  quadro, teto de ~10 fps — lento demais para navegar.

Enquanto você interage, vale o screencast (fluido, ~20 fps, ~40 ms de resposta ao
clique). Assim que você para, o screencast é desligado e a tela passa a ser
enviada em alta resolução. Desligar importa: numa página que se atualiza sozinha
(um relógio, por exemplo) os quadros 1x ficariam apagando os nítidos.
