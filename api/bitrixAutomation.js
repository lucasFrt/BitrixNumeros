import axios from "axios";

const BITRIX_WEBHOOK_URL = "https://gnapp.bitrix24.com.br/rest/4743/mjzjde3zo2cyq0uv/";
const API_CONVERSAO = "https://extensoapi24.vercel.app/api/convert";

// IDs dos campos personalizados
const CAMPO_VALOR_MONETARIO = "UF_CRM_1742475683"; 
const CAMPO_VALOR_EXTENSO = "UF_CRM_1742475560"; 

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ erro: "Método não permitido, use POST" });
    }

    console.log("📡 Iniciando automação no Bitrix24...");

    // Buscar negócios no Bitrix24
    const negociosResponse = await axios.get(`${BITRIX_WEBHOOK_URL}crm.deal.list`, {
      params: { select: ["ID", CAMPO_VALOR_MONETARIO] },
    });

    if (!negociosResponse.data.result) {
      throw new Error("❌ Nenhum negócio encontrado no Bitrix24!");
    }

    const negocios = negociosResponse.data.result;
    console.log(`📦 Encontrados ${negocios.length} negócios.`);

    for (let negocio of negocios) {
      if (!negocio[CAMPO_VALOR_MONETARIO]) continue;

      console.log(`🔄 Convertendo valor do negócio ${negocio.ID}...`);
      const valor = parseFloat(negocio[CAMPO_VALOR_MONETARIO]);

      // Chama a API de conversão
      const conversaoResponse = await axios.post(API_CONVERSAO, { valor });
      if (!conversaoResponse.data.porExtenso) {
        throw new Error("❌ Falha na conversão do valor!");
      }

      const valorExtenso = conversaoResponse.data.porExtenso;
      console.log(`✅ Negócio ${negocio.ID} atualizado com: ${valorExtenso}`);

      // Atualizar Bitrix24
      await axios.post(`${BITRIX_WEBHOOK_URL}crm.deal.update`, {
        id: negocio.ID,
        fields: { [CAMPO_VALOR_EXTENSO]: valorExtenso },
      });
    }

    return res.status(200).json({ mensagem: "✅ Automação concluída com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro na automação:", error.message);
    return res.status(500).json({ erro: "Erro ao processar automação no Bitrix24", detalhes: error.message });
  }
}
