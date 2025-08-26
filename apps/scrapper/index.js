const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const cheerio = require("cheerio");
require("dotenv-mono").config();

const app = express();
const PORT = process.env.SCRAPPER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

class BackendDynamicScraper {
  constructor() {
    this.baseUrl = process.env.SCRAPPER_RIWI_BASE_URL;
    this.loginUrl = `${this.baseUrl}/login/index.php`;
    this.username = process.env.SCRAPPER_RIWI_USERNAME || "";
    this.password = process.env.SCRAPPER_RIWI_PASSWORD || "";
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

  // Función auxiliar para detectar si una celda contiene información de estudiante
  isStudentCell($cell) {
    const cellText = $cell.text().trim().toLowerCase();
    const hasUserPicture =
      $cell.find("img.userpicture, span.userinitials").length > 0;
    const hasProfileLink = $cell.find('a[href*="user/profile.php"]').length > 0;

    // Si tiene imagen de usuario o enlace de perfil, es una celda de estudiante
    return hasUserPicture && hasProfileLink;
  }

  // Función auxiliar para extraer información del estudiante incluyendo imagen
  extractStudentData($cell) {
    const $link = $cell.find("a").first();
    const $img = $cell.find("img.userpicture").first();

    const cellText = $cell.text().trim().replace(/\s+/g, " ");
    const href = $link.attr("href");
    const idMatch = href ? href.match(/id=(\d+)/) : null;
    const extractedId = idMatch ? idMatch[1] : "";

    // Extraer URL de la imagen si existe
    let studentCover = null;
    if ($img.length > 0) {
      const imgSrc = $img.attr("src");
      if (imgSrc) {
        // Si es una URL relativa, convertirla a absoluta
        if (imgSrc.startsWith("/")) {
          studentCover = this.baseUrl + imgSrc;
        } else if (imgSrc.startsWith("http")) {
          studentCover = imgSrc;
        } else {
          studentCover = this.baseUrl + "/" + imgSrc;
        }
      }
    }

    return {
      text: cellText,
      id: extractedId,
      studentCover: studentCover,
    };
  }

  // Función para extraer IDs de cursos de la tabla principal
  extractCourseIds(htmlContent) {
    console.log("Extrayendo IDs de cursos de la tabla principal...");

    const $ = cheerio.load(htmlContent);
    const courseIds = new Set();

    // Buscar enlaces a cursos en la tabla
    $('a[href*="course/view.php?id="]').each((index, element) => {
      const href = $(element).attr("href");
      const idMatch = href ? href.match(/id=(\d+)/) : null;
      if (idMatch) {
        courseIds.add(idMatch[1]);
        console.log(
          `Curso encontrado: ID ${idMatch[1]} - ${$(element).text().trim()}`
        );
      }
    });

    return Array.from(courseIds);
  }

  // Función para obtener calificaciones de un curso específico
  async getCourseGrades(courseId) {
    console.log(`Obteniendo calificaciones del curso ID: ${courseId}`);

    try {
      const gradeUrl = `${this.baseUrl}/grade/report/grader/index.php?id=${courseId}`;
      await this.page.goto(gradeUrl, { waitUntil: "networkidle2" });

      // Esperar a que la tabla de calificaciones se cargue
      await this.page.waitForSelector("#user-grades", { timeout: 10000 });

      const gradesHtml = await this.page.content();
      return this.parseGradesTable(gradesHtml, courseId);
    } catch (error) {
      console.warn(
        `Error al obtener calificaciones del curso ${courseId}: ${error.message}`
      );
      return {};
    }
  }

  // Función mejorada para combinar datos principales con calificaciones
  combineDataWithGrades(mainTableData, courseGrades) {
    console.log(
      "Combinando datos principales con todas las calificaciones individuales..."
    );

    const { headers, rows } = mainTableData;
    const newHeaders = [...headers];

    // Recopilar TODAS las actividades individuales de todos los cursos
    const allActivities = new Map();

    Object.values(courseGrades).forEach((courseData) => {
      Object.values(courseData).forEach((studentData) => {
        if (studentData.grades) {
          Object.entries(studentData.grades).forEach(
            ([activityName, gradeInfo]) => {
              if (!allActivities.has(activityName)) {
                allActivities.set(activityName, {
                  name: activityName,
                  activityId: gradeInfo.activityId,
                  itemId: gradeInfo.itemId,
                });
              }
            }
          );
        }
      });
    });

    console.log(
      `Total de actividades individuales encontradas: ${allActivities.size}`
    );

    // Separar actividades de módulos pruebas y otras
    const activityNames = Array.from(allActivities.keys());
    const modulePruebaNames = activityNames.filter((name) =>
      name.match(/Módulo \d+ - Prueba de desempeño/)
    );
    const sortedModuleNames = modulePruebaNames.sort((a, b) => {
      const getNum = (name) => parseInt(name.match(/Módulo (\d+)/)[1]);
      return getNum(a) - getNum(b);
    });
    const otherNames = activityNames.filter(
      (name) => !modulePruebaNames.includes(name)
    );

    // Agregar headers para módulos pruebas
    sortedModuleNames.forEach((name) => {
      newHeaders.push(name);
    });

    // Agregar header para Total Nivel de dominio
    newHeaders.push("Total Nivel de dominio");

    // Agregar headers para otras actividades
    otherNames.forEach((name) => {
      newHeaders.push(name);
    });

    // Crear un mapa de estudiantes por diferentes identificadores para mejor matching
    const studentGradeMap = new Map();

    Object.values(courseGrades).forEach((courseData) => {
      Object.values(courseData).forEach((studentData) => {
        const studentId = studentData.studentId;
        const studentName = studentData.studentName;

        // Crear múltiples claves de búsqueda para el mismo estudiante
        const searchKeys = [
          studentId,
          studentName,
          studentName.toLowerCase(),
          studentName.replace(/\s+/g, " ").trim(),
          // Extraer solo el nombre (primera palabra) + apellidos
          studentName.split(" ").slice(0, 2).join(" "),
          studentName.split(" ").slice(0, 3).join(" "),
        ];

        searchKeys.forEach((key) => {
          if (key && key.toString().trim()) {
            studentGradeMap.set(key.toString().trim(), studentData);
          }
        });
      });
    });

    console.log(
      `Estudiantes mapeados para búsqueda: ${studentGradeMap.size} claves`
    );

    // Procesar cada fila agregando las calificaciones
    const newRows = rows.map((row, rowIndex) => {
      const newRow = [...row];

      // Múltiples estrategias para encontrar el estudiante
      let matchedStudentData = null;

      // Estrategia 1: Buscar por ID numérico
      for (let i = 0; i < row.length; i++) {
        const cellValue = String(row[i] || "").trim();
        if (/^\d{7,}$/.test(cellValue)) {
          matchedStudentData = studentGradeMap.get(cellValue);
          if (matchedStudentData) {
            console.log(
              `Estudiante encontrado por ID: ${cellValue} -> ${matchedStudentData.studentName}`
            );
            break;
          }
        }
      }

      // Estrategia 2: Buscar por nombre en diferentes columnas
      if (!matchedStudentData) {
        for (let i = 0; i < row.length; i++) {
          const cellValue = String(row[i] || "").trim();

          // Buscar nombres que contengan letras y espacios (posibles nombres de estudiante)
          if (
            cellValue.length > 5 &&
            /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ\s]+$/.test(cellValue)
          ) {
            // Intentar diferentes variaciones del nombre
            const searchVariations = [
              cellValue,
              cellValue.toLowerCase(),
              cellValue.replace(/\s+/g, " "),
              // Extraer solo las primeras palabras si es muy largo
              cellValue.split(" ").slice(0, 3).join(" "),
            ];

            for (const variation of searchVariations) {
              matchedStudentData = studentGradeMap.get(variation);
              if (matchedStudentData) {
                console.log(
                  `Estudiante encontrado por nombre: "${cellValue}" -> ${matchedStudentData.studentName}`
                );
                break;
              }
            }

            if (matchedStudentData) break;
          }
        }
      }

      // Estrategia 3: Búsqueda parcial por nombre si no se encontró match exacto
      if (!matchedStudentData) {
        for (let i = 0; i < row.length; i++) {
          const cellValue = String(row[i] || "").trim();

          if (
            cellValue.length > 5 &&
            /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ\s]+$/.test(cellValue)
          ) {
            // Buscar coincidencias parciales
            for (const [key, studentData] of studentGradeMap.entries()) {
              if (typeof key === "string" && key.length > 5) {
                const similarity = this.calculateStringSimilarity(
                  cellValue.toLowerCase(),
                  key.toLowerCase()
                );
                if (similarity > 0.8) {
                  // 80% de similitud
                  matchedStudentData = studentData;
                  console.log(
                    `Estudiante encontrado por similitud: "${cellValue}" ~= "${key}" (${Math.round(
                      similarity * 100
                    )}%)`
                  );
                  break;
                }
              }
            }
            if (matchedStudentData) break;
          }
        }
      }

      // Agregar calificaciones para módulos pruebas
      sortedModuleNames.forEach((activityName) => {
        let gradeValue = "-";
        if (
          matchedStudentData &&
          matchedStudentData.grades &&
          matchedStudentData.grades[activityName]
        ) {
          const grade = matchedStudentData.grades[activityName].value;
          gradeValue =
            grade !== null && grade !== undefined && grade !== "dimmed_text"
              ? grade
              : "-";
        }
        newRow.push(gradeValue);
      });

      // Calcular y agregar Total Nivel de dominio
      let moduleGrades = sortedModuleNames
        .map((activityName) => {
          if (
            matchedStudentData &&
            matchedStudentData.grades &&
            matchedStudentData.grades[activityName]
          ) {
            const grade = matchedStudentData.grades[activityName].value;
            return grade !== null &&
              grade !== undefined &&
              grade !== "dimmed_text" &&
              grade !== ""
              ? parseFloat(grade)
              : null;
          }
          return null;
        })
        .filter((g) => g !== null);

      const avg =
        moduleGrades.length > 0
          ? (
              moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length
            ).toFixed(2)
          : "-";
      newRow.push(avg);

      // Agregar calificaciones para otras actividades
      otherNames.forEach((activityName) => {
        let gradeValue = "-";
        if (
          matchedStudentData &&
          matchedStudentData.grades &&
          matchedStudentData.grades[activityName]
        ) {
          const grade = matchedStudentData.grades[activityName].value;
          gradeValue =
            grade !== null && grade !== undefined && grade !== "dimmed_text"
              ? grade
              : "-";
        }
        newRow.push(gradeValue);
      });

      // Log para debug si no se encontró estudiante
      if (!matchedStudentData) {
        console.warn(
          `No se pudo mapear estudiante en fila ${rowIndex + 1}:`,
          row
            .slice(0, 5)
            .map((cell, i) => `Col${i}: "${cell}"`)
            .join(", ")
        );
      }

      return newRow;
    });

    const studentsWithGrades = newRows.filter((row) => {
      // Contar cuántas calificaciones no vacías tiene esta fila
      const gradeColumns = newRows[0].length - headers.length;
      const grades = row.slice(-gradeColumns);
      return grades.some(
        (grade) => grade && grade.toString().trim() !== "" && grade !== "-"
      );
    }).length;

    console.log(
      `Datos combinados: ${newRows.length} filas con ${newHeaders.length} columnas`,
      `(${allActivities.size + 1} nuevas columnas de calificaciones agregadas)`,
      `Estudiantes con calificaciones: ${studentsWithGrades}/${newRows.length}`
    );

    return {
      ...mainTableData,
      headers: newHeaders,
      rows: newRows,
      totalActivities: allActivities.size,
      activities: Array.from(allActivities.keys()),
      studentsWithGrades: studentsWithGrades,
    };
  }

  // Función auxiliar para calcular similitud entre strings
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Función auxiliar para calcular distancia de Levenshtein
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // También necesitas mejorar parseGradesTable para capturar mejor los nombres
  parseGradesTable(gradesHtml, courseId) {
    console.log(`Parseando tabla de calificaciones del curso ${courseId}...`);

    const $ = cheerio.load(gradesHtml);
    const grades = {};

    // Extraer headers de actividades individuales
    const activityHeaders = [];

    $("#user-grades thead th.item, #user-grades tr.heading th.item").each(
      (index, element) => {
        const $th = $(element);
        const $link = $th.find('a[href*="mod/"]');

        if ($link.length > 0) {
          const activityName = $link.text().trim();
          const href = $link.attr("href");
          const itemId = $th.attr("data-itemid");

          const idMatch = href ? href.match(/id=(\d+)/) : null;
          const activityId = idMatch ? idMatch[1] : "";

          if (activityName && itemId) {
            activityHeaders.push({
              name: activityName,
              id: activityId,
              itemId: itemId,
            });
          }
        }
      }
    );

    console.log(
      `Actividades individuales encontradas en curso ${courseId}:`,
      activityHeaders.map((h) => `${h.name} (itemId: ${h.itemId})`)
    );

    // Extraer calificaciones por estudiante
    $("#user-grades tbody tr.userrow").each((index, element) => {
      const $row = $(element);

      // Obtener información del estudiante con múltiples estrategias
      const $studentLink = $row.find("a.username").first();
      if ($studentLink.length === 0) return;

      let studentName = $studentLink.text().trim();
      const studentHref = $studentLink.attr("href");
      const studentIdMatch = studentHref ? studentHref.match(/id=(\d+)/) : null;
      const studentId = studentIdMatch ? studentIdMatch[1] : "";

      // Limpiar el nombre del estudiante (remover iniciales si existen)
      studentName = studentName.replace(/^[A-Z]{1,3}\s*/, "").trim();

      if (!studentId) {
        console.warn(`No se pudo extraer ID del estudiante: ${studentName}`);
        return;
      }

      // Extraer calificaciones individuales
      const studentGrades = {
        studentId: studentId,
        studentName: studentName,
        courseId: courseId,
        grades: {},
      };

      // Buscar cada actividad individual por su itemId
      activityHeaders.forEach((activity) => {
        const $gradeCell = $row.find(`td[data-itemid="${activity.itemId}"]`);

        if ($gradeCell.length > 0) {
          let gradeValue = $gradeCell.find(".gradevalue").text().trim();

          // Limpiar valores especiales
          if (
            gradeValue === "-" ||
            gradeValue === "dimmed_text" ||
            !gradeValue
          ) {
            gradeValue = null;
          }

          studentGrades.grades[activity.name] = {
            value: gradeValue,
            activityId: activity.id,
            itemId: activity.itemId,
          };
        } else {
          studentGrades.grades[activity.name] = {
            value: null,
            activityId: activity.id,
            itemId: activity.itemId,
          };
        }
      });

      grades[studentId] = studentGrades;
      console.log(
        `Estudiante procesado: ID=${studentId}, Nombre="${studentName}", Actividades=${
          Object.keys(studentGrades.grades).length
        }`
      );
    });

    console.log(
      `Calificaciones extraídas para ${
        Object.keys(grades).length
      } estudiantes del curso ${courseId}`
    );

    return grades;
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
    const linkColumns = new Set();
    const studentColumns = new Set();

    table.find("thead th, tr:first-child th").each((index, element) => {
      const $th = $(element);
      const text = $th.text().trim().replace(/\s+/g, " ");

      headers.push(text);

      const isLinkColumn =
        text.toLowerCase().includes("link") ||
        text.toLowerCase().includes("enlace");

      if (isLinkColumn) {
        headers.push(`${text} - ID`);
        linkColumns.add(index);

        const isStudentColumn = text.toLowerCase().includes("user");

        if (isStudentColumn) {
          headers.push(`${text} - student_cover`);
          studentColumns.add(index);
        }
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

          if (studentColumns.has(cellIndex)) {
            const studentData = this.extractStudentData($cell);
            rowData.push(studentData.text);
            rowData.push(studentData.id);
            rowData.push(studentData.studentCover);
          } else if (linkColumns.has(cellIndex)) {
            rowData.push(cellText);
            rowData.push(extractedId);
          } else {
            rowData.push(cellText);
          }
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

  async scrapeTableFromReportId(reportId, includeGrades = false) {
    console.log(`Scrapeando tabla desde reporte ID: ${reportId}`);

    // Asegurar que estamos logueados
    if (!this.isInitialized) {
      await this.init();
      await this.login();
    }

    // Descargar la tabla HTML completa
    const htmlContent = await this.downloadHTMLTable(reportId);

    // Parsear la tabla HTML
    let tableData = this.parseHTMLTable(htmlContent);

    // Si se solicita incluir calificaciones
    if (includeGrades) {
      console.log("Obteniendo calificaciones de cursos...");

      // Extraer IDs de cursos de la tabla principal
      const courseIds = this.extractCourseIds(htmlContent);

      if (courseIds.length > 0) {
        console.log(
          `Encontrados ${courseIds.length} cursos para obtener calificaciones`
        );

        // Obtener calificaciones de cada curso
        const courseGrades = {};
        for (const courseId of courseIds) {
          courseGrades[courseId] = await this.getCourseGrades(courseId);

          // Pequeña pausa entre solicitudes para no sobrecargar el servidor
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Combinar datos principales con calificaciones
        tableData = this.combineDataWithGrades(tableData, courseGrades);
      } else {
        console.log("No se encontraron cursos en la tabla principal");
      }
    }

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
    const { reportId, returnFormat, includeGrades = false } = req.body;

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

    const data = await scraper.scrapeTableFromReportId(reportId, includeGrades);

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
    const { includeGrades = false } = req.query;

    if (!scraper.isInitialized) {
      await scraper.init();
      await scraper.login();
    }

    // Usar el nuevo método con report ID 77
    const data = await scraper.scrapeTableFromReportId(
      "77",
      includeGrades === "true"
    );

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

// Nuevo endpoint para probar variables de entorno
app.get("/api/env", (req, res) => {
  res.json({
    PORT: process.env.SCRAPPER_PORT || "3000 (default)",
    RIWI_USERNAME:
      process.env.SCRAPPER_RIWI_USERNAME || "riwipruebas (default)",
    RIWI_PASSWORD: process.env.SCRAPPER_RIWI_PASSWORD
      ? "****** (set)"
      : "Riwi2025* (default)",
    timestamp: new Date().toISOString(),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend scraper corriendo en puerto ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API docs: http://localhost:${PORT}/api`);
  console.log(`🔥 Nuevo endpoint: POST /api/scrape/report`);
  console.log(`🎯 Con calificaciones: includeGrades=true`);
});

module.exports = app;
