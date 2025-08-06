// Importamos las librerías que definimos en package.json
import * as cheerio from "cheerio";
import prettier from "prettier";

// Esta es la función principal que Vercel ejecutará
export default async function handler(request, response) {
  // Solo permitimos peticiones POST
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  // Obtenemos el HTML del cuerpo de la petición que enviará n8n
  const rawHtml = request.body.html;

  if (!rawHtml || rawHtml.startsWith("N/A")) {
    return response
      .status(400)
      .json({ error: "No se proporcionó HTML válido para procesar." });
  }

  try {
    // --- 1. LIMPIEZA CON CHEERIO ---
    const $ = cheerio.load(rawHtml);
    const selectorsToRemove = [
      "script",
      "style",
      "iframe",
      "video",
      "img",
      "svg",
      "button",
      "form",
      "input",
      ".elementor-shortcode",
    ];
    $(selectorsToRemove.join(", ")).remove();
    $("*").each(function () {
      this.attribs = {};
    });
    let cleanedHtml = $("body").html().replace(/\s\s+/g, " ").trim();

    // --- 2. FORMATEO CON PRETTIER ---
    const formattedHtml = await prettier.format(cleanedHtml, {
      parser: "html",
      printWidth: 120,
    });

    // --- 3. ENVIAR LA RESPUESTA CORRECTA ---
    return response.status(200).json({ formattedHtml: formattedHtml });
  } catch (error) {
    // Si algo falla, enviamos un error detallado
    return response.status(500).json({
      error: "No se pudo procesar el HTML.",
      errorMessage: error.message,
    });
  }
}
