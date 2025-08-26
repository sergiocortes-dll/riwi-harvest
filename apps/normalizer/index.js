const fs = require('fs');
const XLSX = require('xlsx');
const readline = require('readline');
const path = require('path');

// Enhanced configuration
const config = {
    inputFile: './downloads/report_84_1756223515168.csv',
    outputDir: './csvs',
    encoding: 'utf8',
    logFile: './csvs/processing.log'
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir, { recursive: true });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Enhanced logging
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(config.logFile, logMessage + '\n');
}

// Enhanced user input with validation
async function preguntar(pregunta, validator = null) {
    return new Promise(resolve => {
        const ask = () => {
            rl.question(pregunta, answer => {
                if (validator && !validator(answer)) {
                    console.log('Entrada inválida. Intenta de nuevo.');
                    ask();
                } else {
                    resolve(answer);
                }
            });
        };
        ask();
    });
}

// Enhanced CSV field escaping with better handling
function escapeCSVField(field) {
    if (field === null || field === undefined) return '';

    let stringField = String(field).trim();

    // Handle special characters that require quoting
    if (stringField.includes(',') || stringField.includes('"') ||
        stringField.includes('\n') || stringField.includes('\r') ||
        stringField.startsWith(' ') || stringField.endsWith(' ')) {
        // Escape internal quotes by doubling them
        stringField = stringField.replace(/"/g, '""');
        return `"${stringField}"`;
    }
    return stringField;
}

// Enhanced data validation
function validateData(data, headers) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo Excel');
    }

    if (!Array.isArray(headers) || headers.length === 0) {
        throw new Error('No se encontraron encabezados válidos');
    }

    log(`Validación exitosa: ${data.length} filas, ${headers.length} columnas`);
    return true;
}

// Enhanced address parsing with better error handling
function parseAddress(address) {
    if (!address || typeof address !== 'string') {
        return ['', '', '', ''];
    }

    const parts = address.split(',').map(p => p.trim());

    if (parts.length >= 3) {
        const streetPart = parts[0];
        const spaceIndex = streetPart.indexOf(' ');

        return [
            spaceIndex > 0 ? streetPart.substring(0, spaceIndex) : '',
            spaceIndex > 0 ? streetPart.substring(spaceIndex + 1) : streetPart,
            parts[1],
            parts.slice(2).join(', ')
        ];
    }

    return [address, '', '', ''];
}

// Enhanced custom parsing with better error handling
function parseCustomField(value, config) {
    if (!value || typeof value !== 'string') {
        return Array(config.subHeaders.length).fill('');
    }

    const delimiter = config.delimiter === 'espacio' ? ' ' : config.delimiter;
    let parts = value.split(delimiter).map(p => p.trim());

    // Adjust array length to match expected sub-headers
    if (parts.length < config.subHeaders.length) {
        parts = parts.concat(Array(config.subHeaders.length - parts.length).fill(''));
    } else if (parts.length > config.subHeaders.length) {
        // Combine extra parts into the last field
        const extraParts = parts.slice(config.subHeaders.length - 1);
        parts = parts.slice(0, config.subHeaders.length - 1);
        parts.push(extraParts.join(delimiter));
    }

    return parts;
}

// Enhanced duplicate detection for normalized values
function generateNormalizedKey(parts, type) {
    // Create a more robust key that handles similar but not identical values
    const cleanParts = parts.map(part =>
        String(part).toLowerCase().trim().replace(/\s+/g, ' ')
    );
    return JSON.stringify(cleanParts) + `_${type}`;
}

// Enhanced main function with better error handling
async function main() {
    try {
        log('Iniciando proceso de normalización de Excel a CSV');

        // Validate input file exists
        if (!fs.existsSync(config.inputFile)) {
            throw new Error(`Archivo Excel no encontrado: ${config.inputFile}`);
        }

        // Read Excel file with error handling
        let workbook, data, headers;
        try {
            const ext = path.extname(config.inputFile).toLowerCase();

            if (ext === '.csv') {
                workbook = XLSX.readFile(config.inputFile, { type: 'file', raw: false });
            } else if (ext === '.xlsx' || ext === '.xls') {
                workbook = XLSX.readFile(config.inputFile);
            } else {
                throw new Error(`Formato no soportado: ${ext}`);
            }

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            headers = data[0];
            const rows = data.slice(1);

            validateData(rows, headers);
            data = rows; // Reassign to exclude headers

        } catch (error) {
            throw new Error(`Error leyendo archivo Excel: ${error.message}`);
        }

        // Display available columns with better formatting
        console.log('\n=== COLUMNAS DISPONIBLES ===');
        headers.forEach((col, index) => {
            console.log(`${index.toString().padStart(2)}: ${col || '[Vacío]'}`);
        });
        console.log('============================\n');

        // Get number of main tables with validation
        const numTablas = parseInt(await preguntar(
            '¿Cuántas tablas principales quieres crear? ',
            answer => !isNaN(parseInt(answer)) && parseInt(answer) > 0
        ));

        const tablas = [];
        const tablasDerivadas = new Map();
        const tablasPuente = [];

        // Configure each table
        for (let i = 0; i < numTablas; i++) {
            console.log(`\n--- Configurando Tabla ${i + 1} ---`);

            const nombreTabla = await preguntar(
                `Nombre de la tabla principal ${i + 1}: `,
                answer => answer.trim().length > 0
            );

            const columnasTabla = await preguntar(
                `Índices de columnas para ${nombreTabla} (separados por coma): `,
                answer => {
                    const indices = answer.split(',').map(c => parseInt(c.trim()));
                    return indices.every(idx => !isNaN(idx) && idx >= 0 && idx < headers.length);
                }
            );

            const cols = columnasTabla.split(',').map(c => parseInt(c.trim()));

            // Normalization configuration
            const colsToNormalize = await preguntar(
                `Índices de columnas en ${nombreTabla} para normalizar (separados por coma, o Enter para ninguna): `
            );

            const normalizeCols = colsToNormalize.trim() ?
                colsToNormalize.split(',').map(c => parseInt(c.trim())).filter(idx => cols.includes(idx)) : [];

            // Configure normalization for each column
            const normalizeTypes = {};
            const normalizeConfigs = {};
            const expandConfigs = {}; // Para columnas que se expanden en la misma tabla

            for (const normCol of normalizeCols) {
                const colName = headers[normCol];
                console.log(`\nConfigurando normalización para: ${colName}`);

                const modo = await preguntar(
                    `Modo de normalización:\n  1) expand - Agregar columnas a esta tabla\n  2) separate - Crear tabla separada\nElige (1/2): `,
                    answer => ['1', '2'].includes(answer.trim())
                );

                const esExpansion = modo === '1';

                const tipo = await preguntar(
                    `Tipo de normalización (simple/address/custom/name): `,
                    answer => ['simple', 'address', 'custom', 'name'].includes(answer.toLowerCase())
                ).then(answer => answer.toLowerCase());

                normalizeTypes[normCol] = tipo;
                expandConfigs[normCol] = esExpansion;

                if (tipo === 'custom') {
                    const subHeadersStr = await preguntar(
                        `Sub-columnas para ${colName} (separadas por coma): `,
                        answer => answer.trim().length > 0
                    );

                    const delimiter = await preguntar(
                        `Delimitador para splitting (o 'espacio' para espacio): `,
                        answer => answer.length > 0
                    );

                    normalizeConfigs[normCol] = {
                        subHeaders: subHeadersStr.split(',').map(h => h.trim()),
                        delimiter: delimiter === 'espacio' ? ' ' : delimiter
                    };
                } else if (tipo === 'name') {
                    // Configuración predefinida para nombres
                    normalizeConfigs[normCol] = {
                        subHeaders: ['name', 'second_name', 'lastname', 'second_lastname'],
                        delimiter: ' '
                    };
                }
            }

            // Primary key configuration
            const pkCol = await preguntar(
                `Índice de columna para clave primaria en ${nombreTabla} (o "auto"): `,
                answer => answer.toLowerCase() === 'auto' ||
                    (!isNaN(parseInt(answer)) && cols.includes(parseInt(answer)))
            );

            const esAutoPK = pkCol.toLowerCase() === 'auto';

            tablas.push({
                nombre: nombreTabla,
                cols,
                normalizeCols,
                normalizeTypes,
                normalizeConfigs,
                expandConfigs, // Nuevo: para saber qué columnas se expanden
                pkCol: esAutoPK ? -1 : parseInt(pkCol),
                data: [],
                headers: []
            });

            log(`Tabla configurada: ${nombreTabla} con ${cols.length} columnas`);
        }

        // Configurar tablas puente
        console.log('\n=== CONFIGURACIÓN DE TABLAS PUENTE ===');
        const crearPuentes = await preguntar(
            '¿Quieres crear tablas puente para relaciones muchos-a-muchos? (s/n): ',
            answer => ['s', 'n', 'si', 'no'].includes(answer.toLowerCase())
        );

        if (['s', 'si'].includes(crearPuentes.toLowerCase())) {
            const numPuentes = parseInt(await preguntar(
                '¿Cuántas tablas puente quieres crear? ',
                answer => !isNaN(parseInt(answer)) && parseInt(answer) > 0
            ));

            for (let i = 0; i < numPuentes; i++) {
                console.log(`\n--- Configurando Tabla Puente ${i + 1} ---`);

                const nombrePuente = await preguntar(
                    `Nombre de la tabla puente ${i + 1} (ej: order_products): `,
                    answer => answer.trim().length > 0
                );

                // Mostrar tablas principales disponibles
                console.log('\nTablas principales disponibles:');
                tablas.forEach((tabla, idx) => console.log(`  ${idx}: ${tabla.nombre}`));

                const tabla1Index = parseInt(await preguntar(
                    'Índice de la primera tabla a relacionar: ',
                    answer => !isNaN(parseInt(answer)) && parseInt(answer) >= 0 && parseInt(answer) < tablas.length
                ));

                const tabla2Index = parseInt(await preguntar(
                    'Índice de la segunda tabla a relacionar: ',
                    answer => !isNaN(parseInt(answer)) && parseInt(answer) >= 0 && parseInt(answer) < tablas.length && parseInt(answer) !== tabla1Index
                ));

                const tabla1 = tablas[tabla1Index];
                const tabla2 = tablas[tabla2Index];

                console.log(`\nColumnas disponibles para ${tabla1.nombre}:`);
                if (tabla1.pkCol === -1) {
                    console.log(`  auto: ID (generado automáticamente)`);
                }
                headers.forEach((col, index) => {
                    if (tabla1.cols.includes(index)) {
                        console.log(`  ${index}: ${col}`);
                    }
                });

                const columnaRelacion1 = await preguntar(
                    `Columna en ${tabla1.nombre} para la relación ('auto' para ID generado automáticamente, o índice de columna): `,
                    answer => {
                        if (answer.toLowerCase() === 'auto') return tabla1.pkCol === -1;
                        const idx = parseInt(answer);
                        return !isNaN(idx) && tabla1.cols.includes(idx);
                    }
                );

                console.log(`\nColumnas disponibles para ${tabla2.nombre}:`);
                if (tabla2.pkCol === -1) {
                    console.log(`  auto: ID (generado automáticamente)`);
                }
                headers.forEach((col, index) => {
                    if (tabla2.cols.includes(index)) {
                        console.log(`  ${index}: ${col}`);
                    }
                });

                const columnaRelacion2 = await preguntar(
                    `Columna en ${tabla2.nombre} para la relación ('auto' para ID generado automáticamente, o índice de columna): `,
                    answer => {
                        if (answer.toLowerCase() === 'auto') return tabla2.pkCol === -1;
                        const idx = parseInt(answer);
                        return !isNaN(idx) && tabla2.cols.includes(idx);
                    }
                );

                // Configurar delimitador para valores múltiples
                const delimitador = await preguntar(
                    `Delimitador para separar múltiples valores (ej: coma, punto y coma, pipe |): `,
                    answer => answer.length > 0
                );

                // Configurar columnas adicionales para la tabla puente
                const columnasAdicionales = await preguntar(
                    `Índices de columnas adicionales para ${nombrePuente} (ej: cantidad, precio) separados por coma, o Enter para ninguna: `
                );

                const colsAdicionales = columnasAdicionales.trim() ?
                    columnasAdicionales.split(',').map(c => parseInt(c.trim())).filter(idx => !isNaN(idx) && idx < headers.length) : [];

                tablasPuente.push({
                    nombre: nombrePuente,
                    tabla1: tabla1.nombre,
                    tabla2: tabla2.nombre,
                    tabla1Index,
                    tabla2Index,
                    columnaRelacion1: columnaRelacion1.toLowerCase() === 'auto' ? 'auto' : parseInt(columnaRelacion1),
                    columnaRelacion2: columnaRelacion2.toLowerCase() === 'auto' ? 'auto' : parseInt(columnaRelacion2),
                    delimitador: delimitador === 'coma' ? ',' : delimitador === 'punto y coma' ? ';' : delimitador,
                    columnasAdicionales: colsAdicionales,
                    data: [],
                    headers: []
                });

                log(`Tabla puente configurada: ${nombrePuente} (${tabla1.nombre} <-> ${tabla2.nombre})`);
            }
        }

        // Process data rows
        log(`Procesando ${data.length} filas de datos`);
        let autoIdCounters = {};
        let processedRows = 0;

        // Crear mapas de lookup para las tablas principales
        const tablasLookup = {};
        const tablasLookupByRow = {}; // Para mapear por índice de fila cuando se usa ID auto

        tablas.forEach(tabla => {
            tablasLookup[tabla.nombre] = new Map();
            tablasLookupByRow[tabla.nombre] = new Map(); // fila -> PK
        });

        data.forEach((row, rowIndex) => {
            try {
                // Procesar tablas principales y construir lookups
                tablas.forEach(tabla => {
                    let filaTabla = tabla.cols.map(colIndex => row[colIndex] || '');

                    // Generate auto PK
                    let pkValue;
                    if (tabla.pkCol === -1) {
                        autoIdCounters[tabla.nombre] = (autoIdCounters[tabla.nombre] || 0) + 1;
                        pkValue = autoIdCounters[tabla.nombre];
                        filaTabla.unshift(pkValue);
                    } else {
                        const pkColIndex = tabla.cols.indexOf(tabla.pkCol);
                        pkValue = filaTabla[pkColIndex];
                    }

                    // Agregar al lookup (valor de columna de relación -> PK)
                    tabla.cols.forEach((colIndex, idx) => {
                        const valor = row[colIndex];
                        if (valor) {
                            tablasLookup[tabla.nombre].set(valor.toString().trim(), pkValue);
                        }
                    });

                    // También mapear por índice de fila para IDs auto-generados
                    tablasLookupByRow[tabla.nombre].set(rowIndex, pkValue);

                    // Process normalization - separar expansiones de tablas derivadas
                    const columnasExpandidas = []; // Para almacenar nuevas columnas

                    tabla.normalizeCols.forEach(normIndex => {
                        const originalColIndex = tabla.cols.indexOf(normIndex);
                        const valorOriginal = filaTabla[originalColIndex + (tabla.pkCol === -1 ? 1 : 0)] || '';
                        const tipo = tabla.normalizeTypes[normIndex];
                        const esExpansion = tabla.expandConfigs[normIndex];

                        if (esExpansion) {
                            // MODO EXPANSIÓN: Agregar columnas a la misma tabla
                            let parts = [];
                            if (tipo === 'address') {
                                parts = parseAddress(valorOriginal);
                            } else if (tipo === 'name') {
                                // Parseo específico para nombres
                                const nombreParts = valorOriginal.trim().split(/\s+/);
                                parts = [
                                    nombreParts[0] || '',      // Primer nombre
                                    nombreParts[1] || '',      // Segundo nombre
                                    nombreParts[2] || '',      // Apellido paterno  
                                    nombreParts[3] || ''       // Apellido materno
                                ];
                            } else if (tipo === 'custom') {
                                parts = parseCustomField(valorOriginal, tabla.normalizeConfigs[normIndex]);
                            } else {
                                parts = [valorOriginal];
                            }

                            // Marcar la columna original para remoción y agregar las nuevas
                            filaTabla[originalColIndex + (tabla.pkCol === -1 ? 1 : 0)] = null; // Marcar para remoción
                            columnasExpandidas.push({ index: originalColIndex, parts });

                        } else {
                            // MODO TABLA SEPARADA: Crear tabla derivada (código original)
                            const nombreTablaDerivada = `${tabla.nombre}_${headers[normIndex].replace(/\s+/g, '_')}`;

                            // Initialize derived table if needed
                            if (!tablasDerivadas.has(nombreTablaDerivada)) {
                                let derivHeaders;
                                if (tipo === 'address') {
                                    derivHeaders = ['Number', 'Street', 'City', 'Country'];
                                } else if (tipo === 'name') {
                                    derivHeaders = ['Primer_Nombre', 'Segundo_Nombre', 'Apellido_Paterno', 'Apellido_Materno'];
                                } else if (tipo === 'custom') {
                                    derivHeaders = tabla.normalizeConfigs[normIndex].subHeaders;
                                } else {
                                    derivHeaders = ['Value'];
                                }

                                tablasDerivadas.set(nombreTablaDerivada, {
                                    nombre: nombreTablaDerivada,
                                    valores: new Map(),
                                    nextId: 1,
                                    headers: ['ID', ...derivHeaders]
                                });
                            }

                            const derivada = tablasDerivadas.get(nombreTablaDerivada);

                            // Parse based on type
                            let parts = [];
                            if (tipo === 'address') {
                                parts = parseAddress(valorOriginal);
                            } else if (tipo === 'name') {
                                const nombreParts = valorOriginal.trim().split(/\s+/);
                                parts = [
                                    nombreParts[0] || '',
                                    nombreParts[1] || '',
                                    nombreParts[2] || '',
                                    nombreParts[3] || ''
                                ];
                            } else if (tipo === 'custom') {
                                parts = parseCustomField(valorOriginal, tabla.normalizeConfigs[normIndex]);
                            } else {
                                parts = [valorOriginal];
                            }

                            // Generate key and store/retrieve ID
                            const key = generateNormalizedKey(parts, tipo);
                            if (!derivada.valores.has(key)) {
                                const id = derivada.nextId++;
                                derivada.valores.set(key, { id, data: parts });
                            }

                            // Replace with foreign key
                            filaTabla[originalColIndex + (tabla.pkCol === -1 ? 1 : 0)] = derivada.valores.get(key).id;
                        }
                    });

                    // Aplicar expansiones: remover columnas marcadas e insertar nuevas
                    if (columnasExpandidas.length > 0) {
                        let filaExpandida = [];
                        let insertOffset = 0;

                        filaTabla.forEach((valor, idx) => {
                            const expansion = columnasExpandidas.find(exp =>
                                exp.index === idx - (tabla.pkCol === -1 ? 1 : 0)
                            );

                            if (expansion) {
                                // Insertar las partes expandidas en lugar de la columna original
                                filaExpandida.push(...expansion.parts);
                            } else if (valor !== null) {
                                // Mantener la columna original
                                filaExpandida.push(valor);
                            }
                            // Si valor === null, la columna se omite (fue marcada para remoción)
                        });

                        filaTabla = filaExpandida;
                    }

                    tabla.data.push(filaTabla);
                });

                // Procesar tablas puente
                tablasPuente.forEach(puente => {
                    // Obtener valores para la relación
                    let valorRelacion1, valorRelacion2;

                    // Para tabla1: decidir si usar ID auto o columna específica
                    if (puente.columnaRelacion1 === 'auto') {
                        // Usar el ID auto-generado de esta fila
                        valorRelacion1 = tablasLookupByRow[puente.tabla1].get(rowIndex);
                        if (valorRelacion1) {
                            valorRelacion1 = [valorRelacion1.toString()]; // Array para consistencia
                        } else {
                            valorRelacion1 = [];
                        }
                    } else {
                        // Usar valor de columna específica y dividir por delimitador
                        const valorCol1 = row[puente.columnaRelacion1] || '';
                        valorRelacion1 = valorCol1.toString().split(puente.delimitador).map(v => v.trim()).filter(v => v);
                    }

                    // Para tabla2: decidir si usar ID auto o columna específica  
                    if (puente.columnaRelacion2 === 'auto') {
                        // Usar el ID auto-generado de esta fila
                        valorRelacion2 = tablasLookupByRow[puente.tabla2].get(rowIndex);
                        if (valorRelacion2) {
                            valorRelacion2 = [valorRelacion2.toString()]; // Array para consistencia
                        } else {
                            valorRelacion2 = [];
                        }
                    } else {
                        // Usar valor de columna específica y dividir por delimitador
                        const valorCol2 = row[puente.columnaRelacion2] || '';
                        valorRelacion2 = valorCol2.toString().split(puente.delimitador).map(v => v.trim()).filter(v => v);
                    }

                    // Obtener columnas adicionales
                    const valoresAdicionales = puente.columnasAdicionales.map(colIndex => row[colIndex] || '');

                    if (valorRelacion1.length > 0 && valorRelacion2.length > 0) {
                        // Crear todas las combinaciones posibles
                        valorRelacion1.forEach((val1, idx1) => {
                            valorRelacion2.forEach((val2, idx2) => {
                                let id1, id2;

                                // Obtener ID1
                                if (puente.columnaRelacion1 === 'auto') {
                                    id1 = parseInt(val1); // Ya es el ID
                                } else {
                                    id1 = tablasLookup[puente.tabla1].get(val1);
                                }

                                // Obtener ID2
                                if (puente.columnaRelacion2 === 'auto') {
                                    id2 = parseInt(val2); // Ya es el ID
                                } else {
                                    id2 = tablasLookup[puente.tabla2].get(val2);
                                }

                                if (id1 && id2) {
                                    // Para valores adicionales que están separados por delimitador, usar el índice correspondiente
                                    let valoresAdicionalesEspecificos = valoresAdicionales.map(val => {
                                        if (val.toString().includes(puente.delimitador)) {
                                            const parts = val.toString().split(puente.delimitador).map(v => v.trim());
                                            // Usar el índice apropiado, o el último si no hay suficientes
                                            return parts[Math.min(idx1, idx2, parts.length - 1)] || '';
                                        }
                                        return val;
                                    });

                                    puente.data.push([id1, id2, ...valoresAdicionalesEspecificos]);
                                } else {
                                    log(`Advertencia: No se encontró relación para ${val1} (${puente.tabla1}) o ${val2} (${puente.tabla2}) en fila ${rowIndex + 1}`, 'WARN');
                                }
                            });
                        });
                    }
                });

                processedRows++;
                if (processedRows % 100 === 0) {
                    log(`Procesadas ${processedRows} filas...`);
                }

            } catch (error) {
                log(`Error procesando fila ${rowIndex + 1}: ${error.message}`, 'ERROR');
            }
        });

        // Prepare headers for main tables
        tablas.forEach(tabla => {
            tabla.headers = tabla.cols.map(colIndex => headers[colIndex]);
            if (tabla.pkCol === -1) tabla.headers.unshift('ID');

            // Procesar headers para expansiones y tabla separadas
            let headersExpandidos = [];

            tabla.headers.forEach((header, idx) => {
                const originalColIndex = tabla.cols[idx - (tabla.pkCol === -1 ? 1 : 0)];
                const normIndex = tabla.normalizeCols.find(nc => nc === originalColIndex);

                if (normIndex && tabla.expandConfigs[normIndex]) {
                    // EXPANSIÓN: Reemplazar header con sub-headers
                    const tipo = tabla.normalizeTypes[normIndex];
                    let subHeaders = [];

                    if (tipo === 'address') {
                        subHeaders = ['Number', 'Street', 'City', 'Country'];
                    } else if (tipo === 'name') {
                        subHeaders = ['Primer_Nombre', 'Segundo_Nombre', 'Apellido_Paterno', 'Apellido_Materno'];
                    } else if (tipo === 'custom') {
                        subHeaders = tabla.normalizeConfigs[normIndex].subHeaders;
                    } else {
                        subHeaders = [header + '_Value'];
                    }

                    headersExpandidos.push(...subHeaders);
                } else if (normIndex && !tabla.expandConfigs[normIndex]) {
                    // TABLA SEPARADA: Cambiar a FK
                    headersExpandidos.push(`${header}_ID`);
                } else {
                    // COLUMNA NORMAL: Mantener original
                    headersExpandidos.push(header);
                }
            });

            tabla.headers = headersExpandidos;
        });

        // Preparar headers para tablas puente
        tablasPuente.forEach(puente => {
            puente.headers = [`${puente.tabla1}_ID`, `${puente.tabla2}_ID`];

            // Agregar headers de columnas adicionales
            puente.columnasAdicionales.forEach(colIndex => {
                puente.headers.push(headers[colIndex]);
            });
        });

        // Generate CSV files
        let totalFiles = 0;

        // Main tables
        tablas.forEach(tabla => {
            try {
                const csvContent = [
                    tabla.headers.map(escapeCSVField).join(','),
                    ...tabla.data.map(row => row.map(escapeCSVField).join(','))
                ].join('\n');

                const filePath = `${config.outputDir}/${tabla.nombre}.csv`;
                fs.writeFileSync(filePath, csvContent, config.encoding);
                log(`CSV principal generado: ${tabla.nombre}.csv (${tabla.data.length} filas)`);
                totalFiles++;
            } catch (error) {
                log(`Error generando CSV para ${tabla.nombre}: ${error.message}`, 'ERROR');
            }
        });

        // Bridge tables
        tablasPuente.forEach(puente => {
            try {
                const csvContent = [
                    puente.headers.map(escapeCSVField).join(','),
                    ...puente.data.map(row => row.map(escapeCSVField).join(','))
                ].join('\n');

                const filePath = `${config.outputDir}/${puente.nombre}.csv`;
                fs.writeFileSync(filePath, csvContent, config.encoding);
                log(`CSV puente generado: ${puente.nombre}.csv (${puente.data.length} relaciones)`);
                totalFiles++;
            } catch (error) {
                log(`Error generando CSV puente para ${puente.nombre}: ${error.message}`, 'ERROR');
            }
        });

        // Derived tables
        for (const [_, derivada] of tablasDerivadas) {
            try {
                const dataDerivada = Array.from(derivada.valores.values(), v => [v.id, ...v.data]);
                const csvContent = [
                    derivada.headers.map(escapeCSVField).join(','),
                    ...dataDerivada.map(row => row.map(escapeCSVField).join(','))
                ].join('\n');

                const filePath = `${config.outputDir}/${derivada.nombre}.csv`;
                fs.writeFileSync(filePath, csvContent, config.encoding);
                log(`CSV derivado generado: ${derivada.nombre}.csv (${dataDerivada.length} filas)`);
                totalFiles++;
            } catch (error) {
                log(`Error generando CSV derivado para ${derivada.nombre}: ${error.message}`, 'ERROR');
            }
        }

        log(`Proceso completado exitosamente. ${totalFiles} archivos CSV generados.`);
        console.log(`\n✅ Proceso completado. Revisa el directorio '${config.outputDir}' para los archivos CSV generados.`);
        console.log(`📋 Log de procesamiento guardado en: ${config.logFile}`);

    } catch (error) {
        log(`Error crítico: ${error.message}`, 'ERROR');
        console.error(`❌ Error: ${error.message}`);
    } finally {
        rl.close();
    }
}

// Execute main function
if (require.main === module) {
    main().catch(error => {
        console.error('Error no manejado:', error);
        process.exit(1);
    });
}