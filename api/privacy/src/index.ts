const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Política de Privacidade — Alvoprompt</title>
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
  <h1>Política de Privacidade — Alvoprompt</h1>
  <p class="muted">Data de vigência: 18 de agosto de 2026</p>

  <p>Esta Política de Privacidade descreve como o aplicativo <strong>Alvoprompt</strong> ("nós", "nosso" ou "aplicativo"), desenvolvido por Alexandre Costa, coleta, usa e compartilha informações quando você utiliza o aplicativo Alvoprompt para Android.</p>

  <h2>1. Contato</h2>
  <div class="card">
    <p>Desenvolvedor: Alexandre Gomes da Costa<br>
    E-mail: <a href="mailto:alexandrecostagg@gmail.com">alexandrecostagg@gmail.com</a></p>
  </div>

  <h2>2. Visão geral</h2>
  <p>O Alvoprompt é um estúdio de vídeo com teleprompter, editor, legendas e recursos de IA para quem grava com o celular. Seus roteiros e vídeos ficam armazenados, por padrão, <strong>localmente no seu dispositivo</strong> (100% offline). Nenhum dado é coletado sem que você use um recurso que dependa da nuvem.</p>

  <h2>3. Dados que coletamos</h2>
  <p>Coletamos apenas os dados necessários para fornecer os recursos solicitados por você:</p>
  <ul>
    <li><strong>Roteiros e textos:</strong> quando você usa a sincronização entre dispositivos (por frase-chave) ou recursos de IA (geração/melhoria de roteiros, tradução de legendas), o texto é enviado aos nossos servidores e processado temporariamente para executar a tarefa.</li>
    <li><strong>Vídeos:</strong> quando você usa o recurso <em>AI Twin</em>, o vídeo é enviado aos nossos servidores para gerar o avatar falante e é processado temporariamente.</li>
    <li><strong>Gravações de voz e áudio:</strong> quando você usa recursos de dublagem com voz de IA (TTS), o áudio/voz é enviado aos nossos servidores para processamento e não é usado para outras finalidades.</li>
  </ul>
  <p>Não coletamos localização, contatos, agenda, nome, e-mail ou quaisquer dados pessoais de identificação, e não exigimos criação de conta.</p>

  <h2>4. Compartilhamento de dados</h2>
  <p>Os dados descritos acima são processados por prestadores de serviços de IA (processamento efêmero) para gerar o resultado solicitado (texto, voz ou vídeo). Não vendemos nem compartilhamos seus dados com terceiros para publicidade ou marketing.</p>

  <h2>5. Segurança</h2>
  <div class="card">
    <span class="tag">Criptografia em trânsito</span>
    <p>Todos os dados enviados do aplicativo para nossos servidores são transmitidos por conexões criptografadas (HTTPS/TLS).</p>
  </div>

  <h2>6. Armazenamento e retenção</h2>
  <p>Roteiros e vídeos são armazenados no seu dispositivo. Dados enviados para sincronização ou processamento de IA são mantidos apenas pelo tempo necessário para executar a operação e excluídos em seguida (processamento efêmero).</p>

  <h2>7. Seus direitos</h2>
  <p>Você pode apagar seus roteiros, vídeos e dados locais a qualquer momento no próprio aplicativo. Para solicitar a exclusão de dados armazenados em nossos servidores, entre em contato pelo e-mail <a href="mailto:alexandrecostagg@gmail.com">alexandrecostagg@gmail.com</a>.</p>

  <h2>8. Menores de idade</h2>
  <p>O aplicativo é destinado a maiores de 18 anos e não é dirigido a crianças. Não coletamos intencionalmente informações de menores de idade.</p>

  <h2>9. Alterações nesta política</h2>
  <p>Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente estará sempre disponível nesta página.</p>

  <p class="muted" style="margin-top:40px">© 2026 Alvoprompt. Todos os direitos reservados.</p>
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
