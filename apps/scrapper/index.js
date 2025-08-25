const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

class BackendDynamicScraper {
  constructor() {
    this.baseUrl = "https://riwi-test.unhosting.site";
    this.loginUrl = `${this.baseUrl}/login/index.php`;
    this.username = process.env.RIWI_USERNAME || "riwipruebas";
    this.password = process.env.RIWI_PASSWORD || "Riwi2025*";
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) {
      return;
    }

    console.log("Iniciando navegador para backend...");

    // Configuración específica para servidor/Docker
    this.browser = await puppeteer.launch({
      headless: true, // SIEMPRE headless en backend
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Para contenedores Docker
        "--disable-gpu",
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Configurar timeout más largo para servidores lentos
    this.page.setDefaultTimeout(60000);
    this.page.setDefaultNavigationTimeout(60000);

    this.isInitialized = true;
  }

  async login() {
    if (!this.isInitialized) {
      await this.init();
    }

    console.log("Realizando login...");
    await this.page.goto(this.loginUrl, { waitUntil: "networkidle2" });

    // Obtener logintoken
    const loginToken = await this.page.$eval(
      'input[name="logintoken"]',
      (el) => el.value
    );

    // Llenar formulario de login
    await this.page.type('input[name="username"]', this.username);
    await this.page.type('input[name="password"]', this.password);

    // Hacer click en el botón de login
    await this.page.click("button#loginbtn");
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    // Verificar que el login fue exitoso
    const logoutExists = (await this.page.$('a[href*="logout"]')) !== null;
    if (!logoutExists) {
      throw new Error("Error: No se pudo iniciar sesión en Moodle.");
    }
    console.log("Login exitoso.");
  }

  async downloadHTMLTable(reportId) {
    console.log(`Descargando tabla HTML para reporte ID: ${reportId}`);

    // Navegar a la página del reporte primero para obtener el sesskey
    const reportUrl = `${this.baseUrl}/reportbuilder/view.php?id=${reportId}`;
    await this.page.goto(reportUrl, { waitUntil: "networkidle2" });

    // Obtener el sesskey del formulario de descarga
    const formData = await this.page.evaluate(() => {
      const form = document.querySelector("form.dataformatselector");
      if (!form) return null;

      const sesskey = form.querySelector('input[name="sesskey"]')?.value;
      const reportId = form.querySelector('input[name="id"]')?.value;

      return { sesskey, reportId };
    });

    if (!formData || !formData.sesskey) {
      throw new Error(
        "No se pudo encontrar el formulario de descarga o el sesskey"
      );
    }

    console.log("Sesskey obtenido:", formData.sesskey);

    // Configurar la descarga
    const downloadUrl = `${this.baseUrl}/reportbuilder/download.php`;

    // Usar el método POST para descargar la tabla HTML
    const response = await this.page.evaluate(
      async (url, sesskey, reportId) => {
        const formData = new FormData();
        formData.append("sesskey", sesskey);
        formData.append("download", "html");
        formData.append("id", reportId);

        try {
          const response = await fetch(url, {
            method: "POST",
            body: formData,
            credentials: "same-origin",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.text();
        } catch (error) {
          throw new Error(`Error en la descarga: ${error.message}`);
        }
      },
      downloadUrl,
      formData.sesskey,
      formData.reportId
    );

    console.log("Tabla HTML descargada exitosamente");
    return response;
  }

  parseHTMLTable(htmlContent) {
    console.log("Analizando tabla HTML descargada...");

    const $ = cheerio.load(htmlContent);
    const table = $("table").first();

    if (!table.length) {
      throw new Error("No se encontró tabla en el HTML descargado");
    }

    // Extraer headers
    const headers = [];
    table.find("thead th, tr:first-child th").each((index, element) => {
      const $th = $(element);
      const text = $th.text().trim().replace(/\s+/g, " ");

      // Verificar si esta columna contiene enlaces
      const hasLinks =
        $th.find("a").length > 0 ||
        text.toLowerCase().includes("enlace") ||
        text.toLowerCase().includes("link");

      if (hasLinks) {
        headers.push(text);
        headers.push(`${text} - ID`);
      } else {
        headers.push(text);
      }
    });

    // Extraer filas de datos
    const rows = [];
    table.find("tbody tr").each((rowIndex, rowElement) => {
      const $row = $(rowElement);
      const rowData = [];

      $row.find("td").each((cellIndex, cellElement) => {
        const $cell = $(cellElement);
        const cellText = $cell.text().trim().replace(/\s+/g, " ");
        const $link = $cell.find("a").first();

        if ($link.length) {
          const href = $link.attr("href");
          const idMatch = href ? href.match(/id=(\d+)/) : null;
          const extractedId = idMatch ? idMatch[1] : "";

          rowData.push(cellText);
          rowData.push(extractedId);
        } else {
          rowData.push(cellText);
        }
      });

      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    console.log(`Se extrajeron ${rows.length} filas de datos de la tabla HTML`);

    return {
      headers,
      rows,
      totalRows: rows.length,
      timestamp: new Date().toISOString(),
    };
  }

  async scrapeTableFromReportId(reportId) {
    console.log(`Scrapeando tabla desde reporte ID: ${reportId}`);

    // Asegurar que estamos logueados
    if (!this.isInitialized) {
      await this.init();
      await this.login();
    }

    // Descargar la tabla HTML completa
    const htmlContent = await this.downloadHTMLTable(reportId);

    // Parsear la tabla HTML
    const tableData = this.parseHTMLTable(htmlContent);

    // Guardar el HTML descargado para referencia (opcional)
    const htmlFileName = `raw_table_${reportId}_${Date.now()}.html`;
    const htmlFilePath = path.join(__dirname, "downloads", htmlFileName);

    if (!fs.existsSync(path.dirname(htmlFilePath))) {
      fs.mkdirSync(path.dirname(htmlFilePath), { recursive: true });
    }

    fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
    console.log(`HTML raw guardado: ${htmlFilePath}`);

    return {
      ...tableData,
      rawHtmlFile: htmlFileName,
    };
  }

  // Método legacy para compatibilidad hacia atrás
  async scrapeTableFromUrl(url, tableSelector = "table.reportbuilder-table") {
    console.log(`Método legacy - extrayendo report ID de URL: ${url}`);

    // Extraer report ID de la URL
    const idMatch = url.match(/id=(\d+)/);
    if (!idMatch) {
      throw new Error("No se pudo extraer el ID del reporte de la URL");
    }

    const reportId = idMatch[1];
    console.log(`Report ID extraído: ${reportId}`);

    return await this.scrapeTableFromReportId(reportId);
  }

  async saveToCSV(data, filename) {
    // Crear directorio downloads si no existe
    const downloadsDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const filePath = path.join(downloadsDir, filename);

    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || "");
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    const csvWithBOM = "\uFEFF" + csvContent;

    fs.writeFileSync(filePath, csvWithBOM, "utf8");
    console.log(`Archivo guardado: ${filePath}`);

    return filePath;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      console.log("Navegador cerrado.");
    }
  }
}

// Instancia global del scraper
const scraper = new BackendDynamicScraper();

// Cleanup al cerrar la aplicación
process.on("SIGINT", async () => {
  console.log("Cerrando aplicación...");
  await scraper.cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Cerrando aplicación...");
  await scraper.cleanup();
  process.exit(0);
});

// ENDPOINTS DE LA API

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    puppeteerReady: scraper.isInitialized,
  });
});

// Inicializar scraper
app.post("/api/initialize", async (req, res) => {
  try {
    await scraper.init();
    await scraper.login();

    res.json({
      success: true,
      message: "Scraper inicializado y login exitoso",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al inicializar:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Scrapear tabla por Report ID (nuevo endpoint recomendado)
app.post("/api/scrape/report", async (req, res) => {
  try {
    const { reportId, returnFormat } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "Report ID es requerido",
      });
    }

    // Asegurar que el scraper esté inicializado
    if (!scraper.isInitialized) {
      await scraper.init();
      await scraper.login();
    }

    const data = await scraper.scrapeTableFromReportId(reportId);

    if (returnFormat === "csv") {
      const filename = `report_${reportId}_${Date.now()}.csv`;
      const filePath = await scraper.saveToCSV(data, filename);

      res.json({
        success: true,
        data,
        downloadUrl: `/downloads/${filename}`,
        rawHtmlUrl: `/downloads/${data.rawHtmlFile}`,
        filePath,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        success: true,
        data,
        rawHtmlUrl: `/downloads/${data.rawHtmlFile}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error en scraping por report ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Scrapear tabla específica (endpoint legacy mejorado)
app.post("/api/scrape", async (req, res) => {
  try {
    const { url, tableSelector, returnFormat } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL es requerida",
      });
    }

    // Asegurar que el scraper esté inicializado
    if (!scraper.isInitialized) {
      await scraper.init();
      await scraper.login();
    }

    const data = await scraper.scrapeTableFromUrl(url, tableSelector);

    if (returnFormat === "csv") {
      const filename = `scrape_${Date.now()}.csv`;
      const filePath = await scraper.saveToCSV(data, filename);

      res.json({
        success: true,
        data,
        downloadUrl: `/downloads/${filename}`,
        rawHtmlUrl: data.rawHtmlFile ? `/downloads/${data.rawHtmlFile}` : null,
        filePath,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        success: true,
        data,
        rawHtmlUrl: data.rawHtmlFile ? `/downloads/${data.rawHtmlFile}` : null,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error en scraping:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Scrapear tabla de cursos (endpoint específico mejorado)
app.get("/api/scrape/courses", async (req, res) => {
  try {
    if (!scraper.isInitialized) {
      await scraper.init();
      await scraper.login();
    }

    // Usar el nuevo método con report ID 77
    const data = await scraper.scrapeTableFromReportId("77");

    const filename = `courses_${Date.now()}.csv`;
    await scraper.saveToCSV(data, filename);

    res.json({
      success: true,
      data,
      downloadUrl: `/downloads/${filename}`,
      rawHtmlUrl: `/downloads/${data.rawHtmlFile}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error scrapeando cursos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Obtener lista de archivos descargados
app.get("/api/downloads", (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, "downloads");

    if (!fs.existsSync(downloadsDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(downloadsDir).map((filename) => {
      const filePath = path.join(downloadsDir, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        downloadUrl: `/downloads/${filename}`,
        type: path.extname(filename).toLowerCase(),
      };
    });

    res.json({ files });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Limpiar recursos
app.post("/api/cleanup", async (req, res) => {
  try {
    await scraper.cleanup();
    res.json({
      success: true,
      message: "Recursos limpiados exitosamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend scraper corriendo en puerto ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API docs: http://localhost:${PORT}/api`);
  console.log(`📥 Nuevo endpoint: POST /api/scrape/report`);
});

module.exports = app;
