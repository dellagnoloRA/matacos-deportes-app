import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyConfig } from "@/config/company";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "orderId es requerido" }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true, brand: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const company = getCompanyConfig();
    const orderCode = sale.invoiceNumber || sale.ticketCode || `WEB-${sale.id.slice(0, 8).toUpperCase()}`;
    const tracking = sale.shippingTrackingCode || `TN3600${sale.id.slice(0, 6).toUpperCase()}AR`;
    const isSucursal = sale.shippingMethod === "CORREO_ARGENTINO_SUCURSAL";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Rótulo de Envío - ${orderCode}</title>
  <style>
    @page {
      size: 100mm 150mm;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #f8fafc;
      padding: 10px;
      display: flex;
      justify-content: center;
    }
    .label-container {
      width: 100mm;
      min-height: 145mm;
      background: #fff;
      border: 2px solid #000;
      padding: 6mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .carrier-logo {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .service-badge {
      font-size: 9pt;
      font-weight: bold;
      border: 1.5px solid #000;
      padding: 1mm 2.5mm;
      border-radius: 2mm;
      text-transform: uppercase;
    }
    .tracking-section {
      text-align: center;
      padding: 4mm 0;
      border-bottom: 2px dashed #000;
    }
    .barcode-placeholder {
      font-family: monospace;
      font-size: 24pt;
      letter-spacing: 4px;
      font-weight: bold;
      margin: 2mm 0;
      padding: 2mm;
      background: #eee;
      border: 1px solid #ccc;
    }
    .tracking-code {
      font-size: 11pt;
      font-weight: bold;
    }
    .party-block {
      padding: 3mm 0;
      border-bottom: 1.5px solid #000;
      font-size: 9pt;
      line-height: 1.35;
    }
    .party-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #333;
      margin-bottom: 1mm;
    }
    .party-name {
      font-size: 11pt;
      font-weight: bold;
    }
    .party-address {
      font-size: 10pt;
    }
    .party-postal {
      font-size: 11pt;
      font-weight: 800;
      margin-top: 1mm;
    }
    .items-slip {
      font-size: 7.5pt;
      color: #444;
      padding-top: 2mm;
    }
    .items-slip table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-slip th, .items-slip td {
      padding: 1mm 0;
      text-align: left;
    }
    .footer {
      font-size: 7pt;
      text-align: center;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 2mm;
      margin-top: 2mm;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .label-container {
        border: 2px solid #000;
        width: 100%;
        min-height: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div>
    <div class="no-print" style="margin-bottom: 12px; text-align: center;">
      <button onclick="window.print()" style="padding: 8px 16px; background: #00D615; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
        🖨️ Imprimir Rótulo (100x150 mm o A4)
      </button>
    </div>

    <div class="label-container">
      <div>
        <div class="header">
          <div class="carrier-logo">CORREO ARGENTINO</div>
          <div class="service-badge">
            ${isSucursal ? "RETIRO SUCURSAL (S)" : "ENTREGA DOMICILIO (D)"}
          </div>
        </div>

        <div class="tracking-section">
          <div class="party-title">NÚMERO DE GUÍA / TRACKING</div>
          <div class="barcode-placeholder">||| | | || ||| | |||</div>
          <div class="tracking-code">${tracking}</div>
          <div style="font-size: 8pt; color: #555; margin-top: 1mm;">Pedido Matacos: ${orderCode}</div>
        </div>

        <!-- DESTINATARIO -->
        <div class="party-block">
          <div class="party-title">DESTINATARIO:</div>
          <div class="party-name">${sale.customerName || "Cliente"}</div>
          ${sale.customerDni ? `<div>DNI/CUIT: ${sale.customerDni}</div>` : ""}
          ${sale.customerPhone ? `<div>Tel: ${sale.customerPhone}</div>` : ""}

          ${
            isSucursal
              ? `<div style="margin-top: 2mm; padding: 2mm; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px;">
                  <div style="font-weight: bold; color: #92400e;">SUCURSAL DE RETIRO:</div>
                  <div style="font-weight: 800; font-size: 10.5pt;">${sale.shippingBranchName || "Sucursal Oficial"}</div>
                  <div>Código de Agencia: <strong>${sale.shippingBranchCode || ""}</strong></div>
                  <div>Localidad: ${sale.shippingCity || ""}</div>
                 </div>`
              : `<div class="party-address" style="margin-top: 1mm;">
                  <div>${sale.shippingAddress || ""}</div>
                  <div>${sale.shippingCity || ""}, Provincia: ${sale.shippingPostalCode ? sale.shippingPostalCode.slice(0, 1) : ""}</div>
                 </div>`
          }

          <div class="party-postal">CÓDIGO POSTAL: ${sale.shippingPostalCode || "3600"}</div>
        </div>

        <!-- REMITENTE -->
        <div class="party-block" style="border-bottom: none;">
          <div class="party-title">REMITENTE:</div>
          <div class="party-name">${company.name}</div>
          <div>Dirección: ${company.address}</div>
          <div>Ciudad: ${company.city} (CP ${company.postalCode})</div>
          <div>CUIT: ${company.cuit} | Tel: ${company.phone}</div>
        </div>
      </div>

      <div>
        <!-- RESUMEN DE EMPAQUE (SLIP) -->
        <div class="items-slip">
          <div style="font-weight: bold; margin-bottom: 1mm;">Artículos en el bulto (${sale.items.reduce((acc, i) => acc + i.quantity, 0)} unidades):</div>
          <table>
            ${sale.items
              .map(
                (item) => `<tr>
                  <td>• ${item.quantity}x ${item.variant.product.name} (T: ${item.variant.size}, Col: ${item.variant.color})</td>
                  <td style="text-align: right; font-family: monospace;">${item.variant.sku}</td>
                </tr>`
              )
              .join("")}
          </table>
        </div>

        <div class="footer">
          Generado automáticamente por el Sistema Integral Matacos Deportes (Saavedra 241, Formosa).
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("[Label Route] Error al generar rótulo:", error);
    return NextResponse.json({ error: "Error interno al generar rótulo" }, { status: 500 });
  }
}
