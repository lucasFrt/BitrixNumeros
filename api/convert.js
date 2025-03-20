const axios = require("axios");

const BITRIX_WEBHOOK_URL = "https://gnapp.bitrix24.com.br/rest/4743/mjzjde3zo2cyq0uv/";
const API_CONVERSAO = "bitrix-numeros.vercel.app"; 

// IDs dos campos personalizados
const CAMPO_VALOR_MONETARIO = "UF_CRM_1742475683"; 
const CAMPO_VALOR_EXTENSO = "UF_CRM_1742475560"; 

// Função para buscar negócios com valor monetário
const buscarNegocios = async () => {
  try {
    const response = await axios.get(`${BITRIX_WEBHOOK_URL}crm.deal.list`, {
      params: { select: ["ID", CAMPO_VALOR_MONETARIO] },
    });

    return response.data.result || [];
  } catch (error) {
    console.error("Erro ao buscar negócios:", error.response?.data || error.message);
    return [];
  }
};

// Função para converter valor para extenso
const converterValor = async (valor) => {
  try {
    const response = await axios.post(API_CONVERSAO, { valor });
    return response.data.porExtenso;
  } catch (error) {
    console.error("Erro ao converter valor:", error.response?.data || error.message);
    return null;
  }
};

// Função para atualizar o campo de valor por extenso no Bitrix24
const atualizarNegocio = async (id, valorExtenso) => {
  try {
    await axios.post(`${BITRIX_WEBHOOK_URL}crm.deal.update`, {
      id,
      fields: { [CAMPO_VALOR_EXTENSO]: valorExtenso },
    });
    console.log(`Negócio ${id} atualizado!`);
  } catch (error) {
    console.error(`Erro ao atualizar negócio ${id}:`, error.response?.data || error.message);
  }
};

// Executar a automação
const executarAutomacao = async () => {
  const negocios = await buscarNegocios();

  for (let negocio of negocios) {
    if (negocio[CAMPO_VALOR_MONETARIO]) {
      const valorExtenso = await converterValor(parseFloat(negocio[CAMPO_VALOR_MONETARIO]));
      if (valorExtenso) await atualizarNegocio(negocio.ID, valorExtenso);
    }
  }
};

executarAutomacao();
