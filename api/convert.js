export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido, use POST" });
  }

  try {
    const body = req.body; // Vercel já processa JSON automaticamente
    const { valor } = body;

    if (typeof valor !== "number" || valor < 0) {
      return res.status(400).json({ erro: "Valor inválido, deve ser um número positivo" });
    }

    // Função para converter número para extenso
    const numeroPorExtenso = (valor) => {
      const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
      const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
      const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
      const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

      let [reais, centavos] = valor.toFixed(2).split(".");
      reais = parseInt(reais, 10);
      centavos = parseInt(centavos, 10);

      const converterCentena = (num) => {
        if (num === 100) return "cem";
        if (num < 10) return unidades[num];
        if (num < 20) return especiais[num - 10];
        if (num < 100) return `${dezenas[Math.floor(num / 10)]}${num % 10 ? " e " + unidades[num % 10] : ""}`;
        return `${centenas[Math.floor(num / 100)]}${num % 100 ? " e " + converterCentena(num % 100) : ""}`;
      };

      let resultado = reais > 0 ? converterCentena(reais) + (reais === 1 ? " real" : " reais") : "";
      if (centavos > 0) resultado += (reais > 0 ? " e " : "") + converterCentena(centavos) + (centavos === 1 ? " centavo" : " centavos");

      return resultado || "zero reais";
    };

    res.json({
      valor,
      formatado: `R$ ${valor.toFixed(2).replace(".", ",")}`,
      porExtenso: numeroPorExtenso(valor),
    });

  } catch (error) {
    console.error("🚨 Erro ao processar JSON:", error);
    return res.status(400).json({ erro: "Erro ao processar requisição, verifique o formato do JSON." });
  }
}
