import PDFDocument from 'pdfkit';
import { Delivery, AddressEntry } from '../../src/types';

export async function generateTransportOrderPDF(delivery: Delivery, supplier?: AddressEntry, transporter?: AddressEntry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: any[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('TRANSPORT ORDER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, { align: 'right' });
    doc.text(`Referentie: ${delivery.reference}`, { align: 'right' });
    doc.moveDown(2);

    // Grid Layout
    const startY = doc.y;
    
    // Column 1: Supplier
    doc.fontSize(12).font('Helvetica-Bold').text('Leverancier:', 50, startY);
    doc.font('Helvetica').fontSize(10);
    if (supplier) {
      doc.text(supplier.name);
      doc.text(supplier.address);
      doc.text(supplier.contact);
      doc.text(supplier.email);
    } else {
      doc.text(delivery.supplierId || 'Onbekend');
    }

    // Column 2: Transporter
    doc.fontSize(12).font('Helvetica-Bold').text('Transporteur:', 300, startY);
    doc.font('Helvetica').fontSize(10);
    if (transporter) {
      doc.text(transporter.name);
      doc.text(transporter.address);
      doc.text(transporter.contact);
    } else {
      doc.text(delivery.transporterId || 'Niet toegewezen');
    }

    doc.moveDown(4);
    const detailsY = doc.y;

    // Delivery Details
    doc.fontSize(12).font('Helvetica-Bold').text('Ritgegevens:', 50, detailsY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Ritnummer: ${delivery.id}`, 50, detailsY + 20);
    doc.text(`Referentie: ${delivery.reference}`, 50, detailsY + 35);
    doc.text(`Type: ${delivery.type.toUpperCase()}`, 50, detailsY + 50);
    doc.text(`Status: ${delivery.status}%`, 50, detailsY + 65);

    doc.text(`Laadland: ${delivery.loadingCountry || 'n.v.t.'}`, 300, detailsY + 20);
    doc.text(`Laadstad: ${delivery.loadingCity || 'n.v.t.'}`, 300, detailsY + 35);
    doc.text(`Gewicht: ${delivery.weight ? delivery.weight + ' kg' : 'Onbekend'}`, 300, detailsY + 50);
    doc.text(`Pallets: ${delivery.palletCount || 0}x ${delivery.palletType || 'Onbekend'}`, 300, detailsY + 65);

    doc.moveDown(4);
    
    // YMS Info (if applicable)
    if (delivery.containerNumber || delivery.billOfLading) {
      doc.fontSize(12).font('Helvetica-Bold').text('Container Informatie:');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Container Nummer: ${delivery.containerNumber || 'Niet opgegeven'}`);
      doc.text(`Bill of Lading: ${delivery.billOfLading || 'Niet opgegeven'}`);
      doc.moveDown();
    }

    // Instructions
    doc.fontSize(12).font('Helvetica-Bold').text('Instructies:');
    doc.font('Helvetica').fontSize(10);
    doc.text(delivery.notes || 'Geen specifieke instructies opgegeven.');

    // Footer
    doc.fontSize(8).text(
      'Dit is een automatisch gegenereerd document door ILG Foodgroup YMS.',
      50,
      doc.page.height - 50,
      { align: 'center', width: 500 }
    );

    doc.end();
  });
}
