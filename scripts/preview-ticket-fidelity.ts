/**
 * Script de Previsualización e Impresión Térmica de Alta Fidelidad — RF-10
 * Simula el ticket físico de muestra extraído de 'contexto/Ticket-Factura Matacos.jpeg'
 * Comandera de 80mm (40 columnas estándar) con emulación de hardware fiscal.
 */

import {
  buildReceiptPayloadFromSaleRecord,
  formatTicketToPlainText,
  formatTicketWithQrAsync,
  formatThermalPrice,
} from "../src/server/services/receiptService";
import QRCode from "qrcode";

async function main() {
  console.log("=".repeat(60));
  console.log("🧾 SIMULADOR DE IMPRESIÓN TÉRMICA — MATACOS DEPORTES (RF-10)");
  console.log("=".repeat(60));

  // 1. Simulación de la venta real reflejada en la foto
  // Fecha en foto: 22/09/2026 10:34:01 (Hora local Formosa UTC-3 -> 13:34:01 UTC)
  const realPhotoSale = {
    id: "d0728c46-7c98-4e5a-8b1e-61e56b3e8e19",
    invoiceNumber: "00008-00026445",
    ticketCode: "#042",
    createdAt: new Date("2026-09-22T13:34:01.000Z"),
    customerName: "", // Consumidor final
    subtotalGross: 4800.0,
    discount: 0.0,
    total: 4800.0,
    seller: { id: "seller-1", name: "Nahir Fornari", email: "nahir@matacos.com" },
    cashier: { id: "cashier-1", name: "Agustín Dellagnolo", email: "agustin@matacos.com", code: "CAJERO01" },
    items: [
      {
        variantId: "var-acc-1",
        quantity: 1,
        originalPrice: 4800.0,
        discount: 0.0,
        unitPrice: 4800.0,
        subtotal: 4800.0,
        variant: {
          sku: "CAN-DRB-01",
          barcode: "7791234567890",
          size: "M",
          color: "Negro",
          product: {
            name: "CANILLERAS DEPORTIVAS PRO",
            brand: { name: "DRB" },
          },
        },
      },
    ],
    payments: [
      {
        id: "pay-1",
        method: "EFECTIVO",
        amount: 4800.0,
        receivedAmount: 4800.0,
        change: 0.0,
      },
    ],
  };

  const receipt = buildReceiptPayloadFromSaleRecord(realPhotoSale);

  console.log("\n[1/3] Payload Estructurado ReceiptData Generado:");
  console.log(`- Emisor: ${receipt.company.legalName} (${receipt.company.cuit})`);
  console.log(`- Comprobante: ${receipt.sale.voucherType} | Nro: ${receipt.sale.invoiceNumber}`);
  console.log(`- Fecha/Hora: ${receipt.sale.date} ${receipt.sale.time}`);
  console.log(`- Total: ${receipt.totals.formattedNetTotal} | IVA contenido: ${receipt.fiscal.formattedVatAmount}`);
  console.log(`- Hash Antifraude: ${receipt.fiscal.securityHash}`);
  console.log(`- QR AFIP: ${receipt.fiscal.qrUrl.slice(0, 55)}...`);

  // 2. Previsualización Térmica Estándar (40 columnas - ancho real comandera)
  console.log("\n" + "=".repeat(60));
  console.log("🖨️ [2/3] VISTA PREVIA MONOCROMÁTICA (40 COLS - IGUAL A FOTO)");
  console.log("=".repeat(60) + "\n");

  const ticketPlain = formatTicketToPlainText(receipt, 40);
  
  // Dibujar con borde de papel térmico continuo
  const lines = ticketPlain.split("\n");
  console.log(" ┌" + "─".repeat(42) + "┐");
  console.log(" │ " + "  MATACOS DEPORTES - SAAVEDRA 241   ".padEnd(41) + "│");
  console.log(" ├" + "─".repeat(42) + "┤");
  lines.forEach((l) => {
    console.log(" │ " + l.padEnd(41) + "│");
  });
  console.log(" └" + "─".repeat(42) + "┘");

  // 3. Previsualización con Código QR Escaneable (Terminal Blocks)
  console.log("\n" + "=".repeat(60));
  console.log("📱 [3/3] VISTA PREVIA CON CÓDIGO QR REAL ESCANEABLE");
  console.log("=".repeat(60) + "\n");

  const ticketWithQr = await formatTicketWithQrAsync(receipt, 40);
  console.log(ticketWithQr);

  console.log("\n" + "=".repeat(60));
  console.log("✅ SIMULACIÓN FINALIZADA CON ÉXITO.");
  console.log("=".repeat(60));
}

main().catch(console.error);
