// bisection.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface BisectionResult {
  iteration: number;
  xi: number;
  xs: number;
  xr: number;
  fxi: number;
  fxr: number;
  error: number;
}

class BisectionMethod {
  private results: BisectionResult[] = [];
  private errorAbsolute: number;
  private decimals: number;
  private maxIterations: number;

  public evaluateFunction(x: number): number {
    const E = Math.E;
    return Math.pow(x, 3) - 6 * Math.pow(x, 2) + 8 * x;
  }

  private formatNumber(num: number): number {
    return parseFloat(num.toFixed(this.decimals));
  }

  public calculate(
    xi: number, 
    xs: number,
    errorAbsolute: number,
    maxIterations: number,
    decimals:number
  ): BisectionResult[] {
    this.errorAbsolute = errorAbsolute;
    this.maxIterations = maxIterations;
    this.decimals = decimals;
    this.results = [];

    let iteration = 0;
    let previousXr = 0;
    let error = 100; // Se inicia en 100% para la primera iteración

    while (iteration < maxIterations && error > errorAbsolute) {
      const xr = this.formatNumber((xi + xs) / 2);
      const fxi = this.formatNumber(this.evaluateFunction(xi));
      const fxr = this.formatNumber(this.evaluateFunction(xr));

      if (iteration > 0) {
        error = this.formatNumber(Math.abs((xr - previousXr) / xr) * 100);
      }

      this.results.push({
        iteration: iteration + 1,
        xi: xi,
        xs: xs,
        xr: xr,
        fxi: fxi,
        fxr: fxr,
        error: error,
      });

      // ✅ **Corrección aquí**: Ajuste correcto del intervalo
      if (fxi * fxr < 0) {
        xs = xr;
      } else {
        xi = xr;
      }

      previousXr = xr;
      iteration++;
    }

    return this.results;
  }

  public generatePDF(
    filePath: string,
    student1: string,
    student2: string
  ): void {
    try {
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Encabezado con nombres de estudiantes
      doc
        .fontSize(14)
        .text("Estudiantes:", { underline: true })
        .moveDown(0.5)
        .fontSize(12)
        .text(`${student1}, ${student2}`)
        .moveDown(1.5);

      // Nombre del método
      doc
        .fontSize(14)
        .text("Método de Bisección", { underline: true })
        .moveDown(1);
      // Función y valores iniciales
      doc
        .fontSize(12)
        .text("Función: f(x) = (667.38 / x) * (1 - e^(-0.146843 * x)) - 40")
        .moveDown(0.5)
        .text(`Valores iniciales:`)
        .text(`Xi = ${this.formatNumber(this.results[0].xi)}`)
        .text(`Xs = ${this.formatNumber(this.results[0].xs)}`)
        .text(`Error permitido = ${this.formatNumber(this.errorAbsolute)}`)
        .moveDown(1.5);
      // Iteraciones detalladas
      doc
        .fontSize(14)
        .text("Proceso de iteraciones:", { underline: true })
        .moveDown(1);

      this.results.forEach((result, index) => {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`Iteración ${result.iteration + 1}:`)
          .font("Helvetica")
          .text(
            `Xi = ${this.formatNumber(result.xi)}, Xs = ${this.formatNumber(
              result.xs
            )}, Xr = ${this.formatNumber(result.xr)}`
          )
          .text(
            `Intervalos de [${this.formatNumber(
              result.xi
            )}, ${this.formatNumber(result.xr)}] y [${this.formatNumber(
              result.xr
            )}, ${this.formatNumber(result.xs)}]`
          )
          .text(
            `f(Xi) = sin(${this.formatNumber(
              result.xi
            )}) + e^${this.formatNumber(result.xi)} * ${this.formatNumber(
              result.xi
            )} = ${this.formatNumber(result.fxi)}`
          )
          .text(
            `f(Xr) = sin(${this.formatNumber(
              result.xr
            )}) + e^${this.formatNumber(result.xr)} * ${this.formatNumber(
              result.xr
            )} = ${this.formatNumber(result.fxr)}`
          );

        const interval =
          result.fxi * result.fxr < 0
            ? `[${this.formatNumber(result.xi)}, ${this.formatNumber(
                result.xr
              )}]`
            : `[${this.formatNumber(result.xr)}, ${this.formatNumber(
                result.xs
              )}]`;

        doc
          .text(
            `La raíz se encuentra en el intervalo ${interval} porque f(xi)*f(xr) ${
              result.fxi * result.fxr < 0 ? "<" : ">"
            } 0`
          )
          .text(`Error: ${this.formatNumber(result.error)}`)
          .moveDown(1);

        if (index === this.results.length - 1) {
          const value = this.evaluateFunction(this.results[index].xr);
          doc.text(`Evaluación de la función ${this.formatNumber(value)}`);
          doc.text(`La raíz es ${this.formatNumber(this.results[index].xr)}`);
        }
      });

      // Tabla al final
      doc.addPage();
      doc
        .fontSize(14)
        .text("Tabla de Resultados:", { underline: true })
        .moveDown(1);

      // Configuración de la tabla
      const headers = [
        "Iteración",
        "Xi",
        "Xs",
        "Xr",
        "f(Xi)",
        "f(Xr)",
        "Error",
      ];
      const columnWidth = 75;
      const rowHeight = 30;
      const rowsPerPage = Math.floor(
        (doc.page.height - doc.y - 50) / rowHeight
      );

      let currentRow = 0;
      let yPosition = doc.y;

      while (currentRow < this.results.length) {
        if (currentRow > 0 && currentRow % rowsPerPage === 0) {
          doc.addPage();
          yPosition = 50;
          this.drawTableHeader(doc, yPosition, headers, columnWidth);
          yPosition += rowHeight;
        } else if (currentRow === 0) {
          this.drawTableHeader(doc, yPosition, headers, columnWidth);
          yPosition += rowHeight;
        }

        const result = this.results[currentRow];
        const row = [
          (result.iteration + 1).toString(),
          this.formatNumber(result.xi),
          this.formatNumber(result.xs),
          this.formatNumber(result.xr),
          this.formatNumber(result.fxi),
          this.formatNumber(result.fxr),
          this.formatNumber(result.error),
        ];

        row.forEach((cell, i) => {
          doc
            .fontSize(10)
            .text(cell.toString(), 50 + i * columnWidth, yPosition + 10, {
              width: columnWidth,
              align: "center",
            });
        });

        // Líneas horizontales y verticales
        doc
          .moveTo(50, yPosition + rowHeight)
          .lineTo(50 + columnWidth * headers.length, yPosition + rowHeight)
          .stroke();

        headers.forEach((_, i) => {
          doc
            .moveTo(50 + i * columnWidth, yPosition)
            .lineTo(50 + i * columnWidth, yPosition + rowHeight)
            .stroke();
        });
        doc
          .moveTo(50 + headers.length * columnWidth, yPosition)
          .lineTo(50 + headers.length * columnWidth, yPosition + rowHeight)
          .stroke();

        yPosition += rowHeight;
        currentRow++;
      }

      doc.end();
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  }

  private drawTableHeader(
    doc: typeof PDFDocument.prototype,
    yPos: number,
    headers: string[],
    columnWidth: number
  ): void {
    // Encabezados con fondo gris
    doc
      .fillColor("#e0e0e0")
      .rect(50, yPos, columnWidth * headers.length, 30)
      .fill();

    doc.fillColor("black");
    headers.forEach((header, i) => {
      doc.fontSize(10).text(header, 50 + i * columnWidth, yPos + 10, {
        width: columnWidth,
        align: "center",
      });
    });

    // Líneas verticales
    headers.forEach((_, i) => {
      doc
        .moveTo(50 + i * columnWidth, yPos)
        .lineTo(50 + i * columnWidth, yPos + 30)
        .stroke();
    });
    doc
      .moveTo(50 + headers.length * columnWidth, yPos)
      .lineTo(50 + headers.length * columnWidth, yPos + 30)
      .stroke();
  }
}

export default BisectionMethod;
