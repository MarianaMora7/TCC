const fs = require('fs');
const path = require('path');

const browserDir = path.resolve(__dirname, '../frontend/dist/frontend/browser');
const indexCsr = path.join(browserDir, 'index.csr.html');
const indexHtml = path.join(browserDir, 'index.html');

try {
  if (fs.existsSync(browserDir)) {
    if (!fs.existsSync(indexHtml) && fs.existsSync(indexCsr)) {
      fs.copyFileSync(indexCsr, indexHtml);
      console.log('✅ [post-build] Copiado index.csr.html para index.html com sucesso.');
    } else if (fs.existsSync(indexHtml)) {
      console.log('✅ [post-build] index.html já existe na pasta de saída.');
    }
  } else {
    console.warn('⚠️ [post-build] Diretório de saída não encontrado:', browserDir);
  }
} catch (err) {
  console.error('❌ [post-build] Erro ao sincronizar index.html:', err.message);
}
