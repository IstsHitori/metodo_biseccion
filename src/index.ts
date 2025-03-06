import BisectionMethod from "./Biseccion";
import path from "path";

const bisection = new BisectionMethod();
const xi = 3; // Valor inicial inferior
const xs = 6    ; // Valor inicial superior
const errorAbsolute = 0.005; // Error permitido
const maxIterations = 100; // Máximo de iteraciones
const decimals = 4; // Cantidad de decimales

const results = bisection.calculate(xi, xs, errorAbsolute, maxIterations, decimals);
bisection.generatePDF(
  path.join(__dirname, "resultados_biseccion.pdf"),
  "Francisco Javier Serrano",
  "Santiago Donado"
);

console.log("PDF generado exitosamente");
