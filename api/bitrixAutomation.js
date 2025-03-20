import axios from "axios";

const BITRIX_WEBHOOK_URL = "https://gnapp.bitrix24.com.br/rest/4743/mjzjde3zo2cyq0uv/";
const API_CONVERSAO = "https://extensoapi24.vercel.app/api/convert";

// IDs dos campos personalizados
const CAMPO_VALOR_MONETARIO = "UF_CRM_1742475683"; 
const CAMPO_VALOR_EXTENSO = "UF_CRM_1742475560"; 

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido, use POST" });
  }

  try {
    // Passo 1: Buscar os negócios com valor monetário no Bitrix24
    const negociosResponse = await axios.get(`${BITRIX_WEBHOOK_URL}crm.deal.list`, {
      params: { select: ["ID", CAMPO_VALOR_MONETARIO] },
    });

    const negocios = negociosResponse.data.result || [];

    // Passo 2: Processar cada negócio e converter o valor para extenso
    for (let negocio of negocios) {
      if (negocio[CAMPO_VALOR_MONETARIO]) {
        const valor = parseFloat(negocio[CAMPO_VALOR_MONETARIO]);

        // Chama a API de conversão na Vercel
        const conversaoResponse = await axios.post(API_CONVERSAO, { valor });
        const valorExtenso = conversaoResponse.data.porExtenso;

        if (valorExtenso) {
          // Passo 3: Atualizar o campo de "Valor por Extenso" no Bitrix24
          await axios.post(`${BITRIX_WEBHOOK_URL}crm.deal.update`, {
            id: negocio.ID,
            fields: { [CAMPO_VALOR_EXTENSO]: valorExtenso },
          });

          console.log(`Negócio ${negocio.ID} atualizado com: ${valorExtenso}`);
        }
      }
    }

    return res.status(200).json({ mensagem: "Automação concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na automação:", error.response?.data || error.message);
    return res.status(500).json({ erro: "Erro ao processar automação no Bitrix24" });
  }
}
