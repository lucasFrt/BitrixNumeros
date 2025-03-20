import axios from "axios";

const BITRIX_WEBHOOK_URL = "https://gnapp.bitrix24.com.br/rest/4743/4z62gw2qawdwm5ha/";
const API_CONVERSAO = "https://extensoapi24.vercel.app/api/convert";

// IDs dos campos personalizados
const CAMPO_VALOR_MONETARIO = "UF_CRM_1742475683";  // ID do campo de dinheiro
const CAMPO_VALOR_EXTENSO = "UF_CRM_1742475560";    // ID do campo de texto para o extenso

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido, use POST" });
  }

  try {
    console.log("📡 Iniciando automação no Bitrix24...");

    // Buscar negócios no Bitrix24
    const negociosResponse = await axios.get(`${BITRIX_WEBHOOK_URL}crm.deal.list`, {
      params: { select: ["ID", CAMPO_VALOR_MONETARIO] },
    });

    if (!negociosResponse.data.result || negociosResponse.data.result.length === 0) {
      console.warn("⚠️ Nenhum negócio encontrado no Bitrix24!");
      return res.status(200).json({ mensagem: "⚠️ Nenhum negócio encontrado para processar." });
    }

    const negocios = negociosResponse.data.result;
    console.log(`📦 Encontrados ${negocios.length} negócios.`);

    for (let negocio of negocios) {
      if (!negocio[CAMPO_VALOR_MONETARIO]) {
        console.warn(`⚠️ Negócio ${negocio.ID} não tem um valor monetário definido. Pulando...`);
        continue;
      }

      console.log(`🔄 Convertendo valor do negócio ${negocio.ID}...`);
      const valor = parseFloat(negocio[CAMPO_VALOR_MONETARIO]);

      // Chama a API de conversão
      let valorExtenso;
      try {
        const conversaoResponse = await axios.post(API_CONVERSAO, { valor });
        if (!conversaoResponse.data.porExtenso) {
          throw new Error("❌ Falha na conversão do valor!");
        }
        valorExtenso = conversaoResponse.data.porExtenso;
      } catch (err) {
        console.error(`❌ Erro ao converter o valor do negócio ${negocio.ID}:`, err.message);
        continue;
      }

      console.log(`✅ Negócio ${negocio.ID} atualizado com: ${valorExtenso}`);

      // Atualizar o campo "Valor por Extenso" no Bitrix24
      try {
        const updateResponse = await axios.post(`${BITRIX_WEBHOOK_URL}crm.deal.update`, {
          id: negocio.ID,
          fields: { [CAMPO_VALOR_EXTENSO]: valorExtenso },
        });

        if (updateResponse.data.result) {
          console.log(`✅ Campo atualizado com sucesso no negócio ${negocio.ID}`);
        } else {
          console.warn(`⚠️ Erro ao atualizar campo no negócio ${negocio.ID}:`, updateResponse.data);
        }
      } catch (err) {
        console.error(`🚨 Falha ao atualizar o negócio ${negocio.ID} no Bitrix24:`, err.message);
      }
    }

    return res.status(200).json({ mensagem: "✅ Automação concluída com sucesso!" });
  } catch (error) {
    console.error("🚨 Erro na automação:", error.message);
    return res.status(500).json({ erro: "Erro ao processar automação no Bitrix24", detalhes: error.message });
  }
}
