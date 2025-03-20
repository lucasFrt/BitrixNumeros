import axios from "axios";
console.log("teste")
const BITRIX_WEBHOOK_URL = "https://gnapp.bitrix24.com.br/rest/4743/mjzjde3zo2cyq0uv/";
const API_CONVERSAO = "https://extensoapi24.vercel.app/api/convert";

// IDs dos campos personalizados
const CAMPO_VALOR_MONETARIO = "UF_CRM_1742475683";
const CAMPO_VALOR_EXTENSO = "UF_CRM_1742475560";

export default async function handler(req, res) {
  console.log("📡 API bitrixAutomation foi chamada!");

  if (req.method !== "POST") {
    console.warn("🚨 Erro: Método não permitido.");
    return res.status(405).json({ erro: "Método não permitido, use POST" });
  }

  try {
    console.log("📡 Buscando negócios no Bitrix24...");

    const negociosResponse = await axios.get(`${BITRIX_WEBHOOK_URL}crm.deal.list`, {
      params: { select: ["ID", CAMPO_VALOR_MONETARIO] },
    });

    console.log("📡 Resposta da API Bitrix24 recebida:", negociosResponse.data);

    if (!negociosResponse.data.result || negociosResponse.data.result.length === 0) {
      console.warn("⚠️ Nenhum negócio encontrado no Bitrix24.");
      return res.status(200).json({ mensagem: "Nenhum negócio encontrado para processar." });
    }

    const negocios = negociosResponse.data.result;

    for (let negocio of negocios) {
      if (!negocio[CAMPO_VALOR_MONETARIO]) {
        console.warn(`⚠️ Negócio ${negocio.ID} sem valor monetário.`);
        continue;
      }

      console.log(`🔄 Convertendo valor do negócio ${negocio.ID}...`);
      const valor = parseFloat(negocio[CAMPO_VALOR_MONETARIO]);

      let valorExtenso;
      try {
        const conversaoResponse = await axios.post(API_CONVERSAO, { valor });
        valorExtenso = conversaoResponse.data.porExtenso;
      } catch (err) {
        console.error(`❌ Erro ao converter valor do negócio ${negocio.ID}:`, err.message);
        continue;
      }

      console.log(`✅ Atualizando negócio ${negocio.ID} com valor: ${valorExtenso}`);

      try {
        const updateResponse = await axios.post(`${BITRIX_WEBHOOK_URL}crm.deal.update`, {
          id: negocio.ID,
          fields: { [CAMPO_VALOR_EXTENSO]: valorExtenso },
        });

        console.log(`📌 Resposta da atualização Bitrix24 para ${negocio.ID}:`, updateResponse.data);
      } catch (err) {
        console.error(`🚨 Falha ao atualizar o negócio ${negocio.ID} no Bitrix24:`, err.message);
      }
    }

    return res.status(200).json({ mensagem: "✅ Automação concluída com sucesso!" });
  } catch (error) {
    console.error("🚨 ERRO GERAL:", error);
    return res.status(500).json({ erro: "Erro ao processar automação no Bitrix24", detalhes: error.message });
  }
}
