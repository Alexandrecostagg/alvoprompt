const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Política de Privacidade — AlvoPrompter</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #0B0D12;
    color: #E7E9EE;
    line-height: 1.6;
  }
  main { max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 1.7rem; color: #fff; }
  h2 { font-size: 1.2rem; margin-top: 2.2em; color: #fff; }
  p, li { color: #C6CAD3; }
  a { color: #8B5CF6; }
  .muted { color: #8A8F9A; font-size: .9rem; }
  .card {
    background: #151922;
    border: 1px solid #232936;
    border-radius: 12px;
    padding: 18px 20px;
    margin: 14px 0;
  }
  .tag {
    display: inline-block;
    background: #8B5CF6;
    color: #fff;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: .78rem;
    margin-right: 6px;
  }
</style>
</head>
<body>
<main>
  <h1>Política de Privacidade — AlvoPrompter</h1>
  <p class="muted">Data de vigência: 19 de agosto de 2026</p>

  <p>Esta Política de Privacidade descreve como o aplicativo <strong>AlvoPrompter</strong> ("nós", "nosso" ou "aplicativo"), desenvolvido por Alexandre Costa, trata informações quando você utiliza o aplicativo na web, Android ou iOS.</p>

  <h2>1. Contato</h2>
  <div class="card">
    <p>Desenvolvedor: Alexandre Gomes da Costa<br>
    E-mail: <a href="mailto:alexandrecostagg@gmail.com">alexandrecostagg@gmail.com</a></p>
  </div>

  <h2>2. Visão geral</h2>
  <p>O AlvoPrompter é um estúdio de vídeo com teleprompter, editor, legendas e recursos opcionais de IA. Roteiros, gravações, perfis de voz e configurações ficam, por padrão, <strong>localmente no seu dispositivo</strong>. Dados saem do aparelho somente quando você aciona um recurso de nuvem.</p>

  <h2>3. Dados que coletamos</h2>
  <p>Coletamos apenas os dados necessários para fornecer os recursos solicitados por você:</p>
  <ul>
    <li><strong>Sincronização:</strong> roteiros, agendamentos e workspaces escolhidos para sincronização são armazenados no Cloudflare KV por até 90 dias desde a última sincronização. A frase-chave funciona como credencial de acesso.</li>
    <li><strong>Texto para IA:</strong> pedidos de geração ou melhoria de roteiro são enviados pelo nosso Worker à DeepSeek. Traduções e síntese de voz são processadas pelo Cloudflare Workers AI.</li>
    <li><strong>Áudio:</strong> arquivos enviados para transcrição são processados pelo Cloudflare Workers AI. As amostras de voz do AI Twin permanecem locais e não treinam um modelo de clonagem.</li>
    <li><strong>Avatar:</strong> somente a descrição textual é enviada para gerar uma imagem. A animação do avatar e a exportação do vídeo acontecem localmente no aparelho.</li>
    <li><strong>Conta:</strong> nome, e-mail, identificador de usuário e estado de verificação são tratados pelo Firebase Authentication e vinculados ao cadastro do AlvoPrompter.</li>
    <li><strong>Equipe:</strong> nome do workspace, e-mails convidados e papéis de acesso são armazenados no Cloudflare D1 para aplicar as permissões no servidor.</li>
    <li><strong>Assinatura e uso:</strong> plano, estado da cobrança, contador mensal de ações de IA e identificadores técnicos do checkout/assinatura ficam no Cloudflare D1. O Asaas recebe os dados necessários para identificar o pagador e processar o checkout.</li>
  </ul>
  <p>Não coletamos sua lista de contatos nem localização precisa. A conta é necessária para sincronização SaaS, assinatura e colaboração; o prompter local pode ser usado sem conta.</p>

  <h2>4. Compartilhamento de dados</h2>
  <p>Usamos Cloudflare, Firebase/Google, DeepSeek e Asaas como operadores de infraestrutura, autenticação, IA e pagamentos para entregar os recursos solicitados. O processamento de IA é transitório, mas dados de conta, assinatura e sincronização seguem as retenções necessárias ao serviço e às obrigações legais. Não vendemos dados nem os compartilhamos para publicidade.</p>

  <h2>5. Segurança</h2>
  <div class="card">
    <span class="tag">Criptografia em trânsito</span>
    <p>Todos os dados enviados do aplicativo para nossos servidores são transmitidos por conexões criptografadas (HTTPS/TLS).</p>
  </div>

  <h2>6. Armazenamento e retenção</h2>
  <p>Dados locais permanecem até você apagá-los ou remover o aplicativo. Conteúdo do sync legado expira no Cloudflare KV após 90 dias sem renovação. Dados de conta, workspace e assinatura permanecem enquanto a conta ou relação contratual estiver ativa e depois pelo prazo necessário para segurança, defesa de direitos e obrigações legais. Solicitações de IA são mantidas apenas conforme necessário para processamento e segurança dos respectivos provedores.</p>

  <h2>7. Seus direitos</h2>
  <p>Você pode apagar seus roteiros, vídeos e dados locais a qualquer momento no próprio aplicativo. Pode também solicitar acesso, correção, portabilidade ou exclusão dos dados de conta, observadas as retenções legais e financeiras. Para exercer esses direitos, entre em contato pelo e-mail <a href="mailto:alexandrecostagg@gmail.com">alexandrecostagg@gmail.com</a>.</p>

  <h2>8. Menores de idade</h2>
  <p>O aplicativo é destinado a maiores de 18 anos e não é dirigido a crianças. Não coletamos intencionalmente informações de menores de idade.</p>

  <h2>9. Alterações nesta política</h2>
  <p>Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente estará sempre disponível nesta página.</p>

  <p class="muted" style="margin-top:40px">© 2026 AlvoPrompter. Todos os direitos reservados.</p>
</main>
</body>
</html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\n", { headers: { "content-type": "text/plain" } });
    }
    return new Response(HTML, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
